import React, { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../../core/state/store';
import { Vector2Math } from '../../core/geometry/Vector2Math';
import { RoomUtils } from '../../core/domain/RoomUtils';
import type { Opening } from '../../core/domain/types';
import { v4 as uuidv4 } from 'uuid';

// Constants
const NODE_RADIUS = 0.15; // meters
const GRID_SIZE = 20; // meters (20x15 default view)
const GRID_HEIGHT = 15;

export const FloorPlanEditor: React.FC = () => {
  const project = useEditorStore(state => state.project);
  const activeTool = useEditorStore(state => state.activeTool);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const activeFloorId = useEditorStore(state => state.activeFloorId);
  const { addNode, addWall, addOpening, moveNode, removeWall, removeNode } = useEditorStore();
  const snapGridSize = useEditorStore(state => state.snapGridSize);

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const previewWallIdRef = useRef<string | null>(null);

  // Interaction State
  const [tempNodeId, setTempNodeId] = useState<string | null>(null);
  const [activeWallStartId, setActiveWallStartId] = useState<string | null>(null);
  const [openingPreview, setOpeningPreview] = useState<{wallId: string, dist: number, pos: {x:number, y:number}} | null>(null);

  // Convert screen coordinates to SVG coordinates using the SVG's CTM
  const getMouseCoords = useCallback((e: React.MouseEvent): { x: number, y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  }, []);

  // Returns the ID of an existing node within snapping tolerance of pos, excluding given IDs
  const findExistingNode = useCallback((pos: { x: number; y: number }, exclude: Set<string>): string | null => {
    const SNAP_TOLERANCE = NODE_RADIUS * 2;
    let best: string | null = null;
    let bestDist = SNAP_TOLERANCE;
    Object.values(project.nodes).forEach(node => {
      if (exclude.has(node.id)) return;
      const d = Vector2Math.distance(pos, node);
      if (d < bestDist) {
        bestDist = d;
        best = node.id;
      }
    });
    return best;
  }, [project.nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rawPos = getMouseCoords(e);
    const snapped = Vector2Math.snap(rawPos, snapGridSize);

    if (activeTool === 'wall' && tempNodeId) {
      moveNode(tempNodeId, snapped.x, snapped.y);
    }
    
    if (activeTool === 'opening') {
      let closestDist = Infinity;
      let bestWallId: string | null = null;
      let bestProj: { x: number, y: number } | null = null;
      let distFromStart = 0;

      Object.values(project.walls).forEach(wall => {
        const start = project.nodes[wall.startNodeId];
        const end = project.nodes[wall.endNodeId];
        if (!start || !end) return;
        
        const proj = Vector2Math.closestPointOnSegment(start, end, rawPos);
        const d = Vector2Math.distance(rawPos, proj);
        
        if (d < 0.5 && d < closestDist) {
          closestDist = d;
          bestWallId = wall.id;
          bestProj = proj;
          distFromStart = Vector2Math.distance(start, proj);
        }
      });

      if (bestWallId && bestProj) {
        setOpeningPreview({ wallId: bestWallId, dist: distFromStart, pos: bestProj });
      } else {
        setOpeningPreview(null);
      }
    }
  }, [activeTool, tempNodeId, project.walls, project.nodes, snapGridSize, moveNode, getMouseCoords]);

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    const rawPos = getMouseCoords(e);
    const snapped = Vector2Math.snap(rawPos, snapGridSize);

    if (activeTool === 'opening' && openingPreview) {
      addOpening({
        id: uuidv4(),
        wallId: openingPreview.wallId,
        distFromStart: openingPreview.dist,
        width: 0.9,
        height: 2.1,
        altitude: 0,
        type: 'door'
      });
      setOpeningPreview(null);
      return;
    }

    if (activeTool === 'wall') {
      const floorId = activeFloorId ?? Object.values(project.floors)[0]?.id;
      if (!floorId) return;

      if (activeWallStartId && tempNodeId) {
        // Zero-length check: ignore click if too close to the previous chain node
        const chainStartNode = project.nodes[activeWallStartId];
        if (chainStartNode && Vector2Math.distance(snapped, chainStartNode) < snapGridSize) return;

        // Check for nearby existing node to snap to (excluding the floating temp)
        const nearbyId = findExistingNode(snapped, new Set([tempNodeId]));

        if (nearbyId) {
          // Snap to existing node: swap out temp for the real node
          if (previewWallIdRef.current) removeWall(previewWallIdRef.current);
          removeNode(tempNodeId);
          addWall(activeWallStartId, nearbyId, floorId);
          // Continue chain from the snapped node
          const nextTemp = addNode(snapped.x, snapped.y);
          setActiveWallStartId(nearbyId);
          setTempNodeId(nextTemp);
          previewWallIdRef.current = addWall(nearbyId, nextTemp, floorId);
        } else {
          // Normal: promote temp to chain start, create new preview
          const prevTempId = tempNodeId;
          setActiveWallStartId(prevTempId);
          const nextTemp = addNode(snapped.x, snapped.y);
          setTempNodeId(nextTemp);
          previewWallIdRef.current = addWall(prevTempId, nextTemp, floorId);
        }
      } else {
        // Start new wall chain; snap first click to existing node if nearby
        const startId = findExistingNode(snapped, new Set()) ?? addNode(snapped.x, snapped.y);
        setActiveWallStartId(startId);
        const tempId = addNode(snapped.x, snapped.y);
        setTempNodeId(tempId);
        previewWallIdRef.current = addWall(startId, tempId, floorId);
      }
    }
  }, [activeTool, openingPreview, activeWallStartId, tempNodeId, activeFloorId, project.floors, project.nodes, snapGridSize, addNode, addWall, addOpening, removeWall, removeNode, findExistingNode, getMouseCoords]);

  const cancelOperation = useCallback(() => {
    if (activeTool === 'wall' && tempNodeId) {
      if (previewWallIdRef.current) {
        removeWall(previewWallIdRef.current);
        previewWallIdRef.current = null;
      }
      removeNode(tempNodeId);
    }
    setActiveWallStartId(null);
    setTempNodeId(null);
    setOpeningPreview(null);
  }, [activeTool, tempNodeId, removeWall, removeNode]);

  // Keyboard handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelOperation();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelOperation]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    cancelOperation();
  }, [cancelOperation]);

  // Render openings
  const renderOpenings = () => {
    const openings = Object.values(project.openings);
    const toRender = openings.map(o => ({ ...o, isPreview: false }));
    
    if (openingPreview && activeTool === 'opening') {
      toRender.push({
        id: 'preview',
        wallId: openingPreview.wallId,
        distFromStart: openingPreview.dist,
        width: 0.9,
        height: 2.1,
        altitude: 0,
        type: 'door',
        isPreview: true
      } as Opening & { isPreview: boolean });
    }

    return toRender.map(op => {
      const wall = project.walls[op.wallId];
      if (!wall) return null;
      const start = project.nodes[wall.startNodeId];
      const end = project.nodes[wall.endNodeId];
      if (!start || !end) return null;
      
      const dir = Vector2Math.normalize(Vector2Math.subtract(end, start));
      const pos = Vector2Math.add(start, Vector2Math.scale(dir, op.distFromStart));
      const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
      const opacity = op.isPreview ? 0.5 : 1.0;

      return (
        <g key={op.id} transform={`translate(${pos.x}, ${pos.y}) rotate(${angle})`} opacity={opacity}>
          <rect x={-op.width / 2} y={-wall.thickness / 2} width={op.width} height={wall.thickness}
            fill="white" stroke={op.isPreview ? "blue" : "black"} strokeWidth={0.05} />
          {op.type === 'door' && (
            <path d={`M ${-op.width/2} ${-wall.thickness/2} Q ${-op.width/2} ${-wall.thickness/2 - op.width} ${op.width/2} ${-wall.thickness/2 - op.width} L ${op.width/2} ${-wall.thickness/2}`}
              fill="none" stroke={op.isPreview ? "blue" : "black"} strokeWidth={0.02} strokeDasharray="0.1" />
          )}
        </g>
      );
    });
  };

  const walls = Object.values(project.walls);
  const nodes = Object.values(project.nodes);
  const rooms = Object.values(project.rooms);

  return (
    <div 
      className="bg-gray-100 relative"
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        viewBox={`0 0 ${GRID_SIZE} ${GRID_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onClick={handleSvgClick}
        onContextMenu={handleContextMenu}
      >
        {/* Grid Pattern */}
        <defs>
          <pattern id="smallGrid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#d1d5db" strokeWidth="0.02" />
          </pattern>
          <pattern id="largeGrid" width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="url(#smallGrid)" />
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#9ca3af" strokeWidth="0.04" />
          </pattern>
        </defs>
        
        {/* Background Grid */}
        <rect x="0" y="0" width={GRID_SIZE} height={GRID_HEIGHT} fill="url(#largeGrid)" />

        {/* Rooms */}
        {rooms.map(room => {
          const poly = RoomUtils.getPolygon(project, room);
          const path = RoomUtils.toSvgPath(poly);
          const isSelected = selectedIds.includes(room.id);
          return (
            <path 
              key={room.id} 
              d={path} 
              fill={isSelected ? "#60a5fa" : "#bfdbfe"} 
              fillOpacity="0.5" 
              stroke={isSelected ? "#2563eb" : "none"} 
              strokeWidth={0.05}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { 
                e.stopPropagation(); 
                useEditorStore.getState().select([room.id]); 
                useEditorStore.getState().setTool('select'); 
              }} 
            />
          );
        })}

        {/* Walls */}
        {walls.map(wall => {
          const start = project.nodes[wall.startNodeId];
          const end = project.nodes[wall.endNodeId];
          const isSelected = selectedIds.includes(wall.id);
          
          if (!start || !end) return null;
          return (
            <line
              key={wall.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isSelected ? "#2563eb" : "#374151"}
              strokeWidth={wall.thickness}
              strokeLinecap="round"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                useEditorStore.getState().select([wall.id]);
                useEditorStore.getState().setTool('select');
              }}
            />
          );
        })}
        
        {renderOpenings()}

        {/* Nodes */}
        {nodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            fill={node.id === activeWallStartId ? '#2563eb' : '#9CA3AF'}
          />
        ))}
      </svg>
      
      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg text-sm font-mono border border-gray-200">
        <div className="flex gap-4 items-center">
          <span>Tool: <span className="font-bold text-blue-600 uppercase">{activeTool}</span></span>
          <span className="text-gray-400">|</span>
          <span>Walls: {walls.length}</span>
          <span className="text-gray-400">|</span>
          <span>Rooms: {rooms.length}</span>
        </div>
        <div className="text-gray-500 text-xs mt-1">
          Right-click or ESC to cancel • Click walls to select
        </div>
      </div>
    </div>
  );
};
