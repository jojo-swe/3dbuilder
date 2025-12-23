import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../core/state/store';
import { Vector2Math } from '../../core/geometry/Vector2Math';
import { RoomUtils } from '../../core/domain/RoomUtils';
import type { Opening } from '../../core/domain/types';
import { v4 as uuidv4 } from 'uuid';

// Constants for visualization
const NODE_RADIUS = 0.15; // meters

// Constants
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 20; // pixels per meter
const MAX_ZOOM = 200;

export const FloorPlanEditor: React.FC = () => {
  const project = useEditorStore(state => state.project);
  const activeTool = useEditorStore(state => state.activeTool);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const { addNode, addWall, addOpening, moveNode, removeWall, removeNode } = useEditorStore();
  const snapGridSize = useEditorStore(state => state.snapGridSize);

  // Viewport State
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({
      centerX: 10, // meters
      centerY: 7.5, // meters
      zoom: 80 // pixels per meter - increased for better initial visibility
  });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showHelp, setShowHelp] = useState(true);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  
  // existing state...
  const [tempNodeId, setTempNodeId] = useState<string | null>(null);
  const [activeWallStartId, setActiveWallStartId] = useState<string | null>(null);
  const [openingPreview, setOpeningPreview] = useState<{wallId: string, dist: number, pos: {x:number, y:number}} | null>(null);

  // Resize Observer
  React.useEffect(() => {
      if (!containerRef.current) return;
      const obs = new ResizeObserver(entries => {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
      });
      obs.observe(containerRef.current);
      return () => obs.disconnect();
  }, []);

  // Calculate viewBox
  const viewBox = React.useMemo(() => {
      // We want centerX, centerY to be in the middle
      // Width in meters = dimensions.width / viewState.zoom
      const wMeters = dimensions.width / viewState.zoom;
      const hMeters = dimensions.height / viewState.zoom;
      const minX = viewState.centerX - wMeters / 2;
      const minY = viewState.centerY - hMeters / 2;
      
      // Prevent NaN/Infinity during init
      if (!Number.isFinite(minX)) return "0 0 20 15";
      
      return `${minX} ${minY} ${wMeters} ${hMeters}`;
  }, [viewState, dimensions]);

  // Coordinate Mapping
  const getMouseCoords = (e: React.MouseEvent): { x: number, y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      
      const wMeters = dimensions.width / viewState.zoom;
      const hMeters = dimensions.height / viewState.zoom;
      
      // Map pixel to meters based on current view center
      const x = (px / viewState.zoom) + (viewState.centerX - wMeters/2);
      const y = (py / viewState.zoom) + (viewState.centerY - hMeters/2);
      
      return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom * (1 - e.deltaY * ZOOM_SENSITIVITY)));
      
      // Optional: Zoom towards mouse pointer logic could go here
      // For now, simpler center-zoom
      setViewState(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1 || activeTool === 'select') { // Middle click or Select tool panning
          setIsPanning(true);
          setLastPanPos({ x: e.clientX, y: e.clientY });
          e.preventDefault(); 
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Pan Logic
    if (isPanning) {
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;
        setViewState(prev => ({
            ...prev,
            centerX: prev.centerX - dx / prev.zoom,
            centerY: prev.centerY - dy / prev.zoom
        }));
        setLastPanPos({ x: e.clientX, y: e.clientY });
        return;
    }

    const rawPos = getMouseCoords(e);
    const snapped = Vector2Math.snap(rawPos, snapGridSize);

    if (activeTool === 'wall' && tempNodeId) {
      moveNode(tempNodeId, snapped.x, snapped.y);
    }
    
    // ... opening logic ...
    if (activeTool === 'opening') {
        let closestDist = Infinity;
        let bestWallId: string | null = null;
        let bestProj: { x: number, y: number } | null = null;
        let distFromStart = 0;

        Object.values(project.walls).forEach(wall => {
            const start = project.nodes[wall.startNodeId];
            const end = project.nodes[wall.endNodeId];
            const pt = rawPos; 
            const proj = Vector2Math.closestPointOnSegment(start, end, pt);
            
            const positionVector = {x: pt.x, y: pt.y};
            const d = Vector2Math.distance(positionVector, proj);
            
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
  };
  
  // ... (Click, Cancel, ContextMenu handlers same as before) ...
  const handleSvgClick = (e: React.MouseEvent) => {
    // If panning, don't click
    if (isPanning) return;
    
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
      if (activeWallStartId) {
        if(tempNodeId) {
            setActiveWallStartId(tempNodeId);
            const nextTemp = addNode(snapped.x, snapped.y);
            setTempNodeId(nextTemp);
            
            const firstFloor = Object.values(project.floors)[0];
            if (firstFloor) {
                addWall(tempNodeId, nextTemp, firstFloor.id);
            }
        }
      } else {
        const newNodeId = addNode(snapped.x, snapped.y);
        setActiveWallStartId(newNodeId);
        
        const tempId = addNode(snapped.x, snapped.y);
        setTempNodeId(tempId);
        
        const firstFloor = Object.values(project.floors)[0];
        if (firstFloor) {
            addWall(newNodeId, tempId, firstFloor.id);
        }
      }
    }
  };
  
  const cancelOperation = () => {
      if (activeTool === 'wall' && activeWallStartId && tempNodeId) {
          const wallId = Object.values(project.walls).find(w => 
              (w.startNodeId === activeWallStartId && w.endNodeId === tempNodeId) ||
              (w.startNodeId === tempNodeId && w.endNodeId === activeWallStartId)
          )?.id;
          
          if (wallId) {
             removeWall(wallId);
          }
          removeNode(tempNodeId);
      }
      setActiveWallStartId(null);
      setTempNodeId(null);
      setOpeningPreview(null);
  };

   React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelOperation();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, activeWallStartId, tempNodeId, project.walls]);

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      cancelOperation();
  };

  // Render Openings helper
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
          
          const dir = Vector2Math.normalize(Vector2Math.subtract(end, start));
          const pos = Vector2Math.add(start, Vector2Math.scale(dir, op.distFromStart));
          const angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
          const opacity = op.isPreview ? 0.5 : 1.0;

          return (
             <g key={op.id} transform={`translate(${pos.x}, ${pos.y}) rotate(${angle})`} opacity={opacity}>
                 <rect x={-op.width / 2} y={-wall.thickness / 2} width={op.width} height={wall.thickness}
                    fill="white" stroke={op.isPreview ? "blue" : "black"} strokeWidth={0.05} />
                 {op.type === 'door' && (
                     <path d={`M ${-op.width/2} ${-wall.thickness/2} Q ${-op.width/2} ${-wall.thickness/2 - op.width} ${-op.width/2 + op.width} ${-wall.thickness/2 - op.width} L ${-op.width/2 + op.width} ${-wall.thickness/2}`}
                        fill="none" stroke={op.isPreview ? "blue" : "black"} strokeWidth={0.02} strokeDasharray="0.05" />
                 )}
            </g>
          );
      });
  };

  const walls = Object.values(project.walls);
  const nodes = Object.values(project.nodes);
  const rooms = Object.values(project.rooms);

  return (
    <div ref={containerRef} className="editor-area bg-gray-50 flex-1 relative overflow-hidden h-full cursor-crosshair">
      <svg
        className="w-full h-full block touch-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleSvgClick}
        onContextMenu={handleContextMenu}
        viewBox={viewBox}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="gray" strokeWidth={0.02} opacity="0.3"/>
          </pattern>
        </defs>
        
        {/* Infinite Grid Simulation (Large Rect) */}
        <rect x={viewState.centerX - 100} y={viewState.centerY - 100} width="200" height="200" fill="url(#grid)" />

        {/* ... Nodes, Walls, Rooms Rendering ... */}
        {rooms.map(room => {
             const poly = RoomUtils.getPolygon(project, room);
             const path = RoomUtils.toSvgPath(poly);
             const isSelected = selectedIds.includes(room.id);
             return (
                 <path key={room.id} d={path} fill={isSelected ? "#60a5fa" : "#bfdbfe"} 
                    fillOpacity="0.5" stroke={isSelected ? "#2563eb" : "none"} strokeWidth={isSelected ? 0.05 : 0}
                    onClick={(e) => { e.stopPropagation(); useEditorStore.getState().select([room.id]); useEditorStore.getState().setTool('select'); }} />
             );
        })}

        {walls.map(wall => {
          const start = project.nodes[wall.startNodeId];
          const end = project.nodes[wall.endNodeId];
          const isSelected = selectedIds.includes(wall.id);
          if (!start || !end) return null;
          return (
            <line key={wall.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}
              stroke={isSelected ? "#2563eb" : "#374151"} strokeWidth={wall.thickness} strokeLinecap="round"
              onClick={(e) => { e.stopPropagation(); useEditorStore.getState().select([wall.id]); useEditorStore.getState().setTool('select'); }} />
          );
        })}
        
        {renderOpenings()}

        {nodes.map(node => (
          <circle key={node.id} cx={node.x} cy={node.y} r={NODE_RADIUS}
            fill={node.id === activeWallStartId ? '#2563eb' : '#9CA3AF'} />
        ))}
      </svg>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute right-4 bottom-14 flex flex-col gap-2">
         <button className="bg-white p-2 text-gray-700 shadow rounded hover:bg-gray-100 font-bold text-lg" onClick={() => setViewState(s => ({...s, zoom: Math.min(MAX_ZOOM, s.zoom * 1.2)}))}>+</button>
         <button className="bg-white p-2 text-gray-700 shadow rounded hover:bg-gray-100 font-bold text-lg" onClick={() => setViewState(s => ({...s, zoom: Math.max(MIN_ZOOM, s.zoom / 1.2)}))}>−</button>
         <button className="bg-white p-2 text-gray-700 shadow rounded hover:bg-gray-100 text-xs" onClick={() => setViewState({ centerX: 10, centerY: 7.5, zoom: 80 })} title="Reset View">⌂</button>
      </div>

      {/* Getting Started Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to 3D House Builder! 🏠</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-lg mb-2">Getting Started:</h3>
                <ul className="space-y-2 ml-4">
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">Wall Tool</span> - Click to place walls, right-click or ESC to finish</li>
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">Select Tool</span> - Click walls/rooms to select and edit properties</li>
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">Opening Tool</span> - Click on a wall to place doors/windows</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Navigation:</h3>
                <ul className="space-y-2 ml-4">
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">Mouse Wheel</span> - Zoom in/out</li>
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">Middle Click + Drag</span> - Pan around</li>
                  <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">+/− Buttons</span> - Zoom controls (bottom right)</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> The grid snaps to 0.1m increments. Walls automatically create rooms when they form closed loops!
                </p>
              </div>
            </div>
            <button 
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              onClick={() => setShowHelp(false)}
            >
              Got it! Let's Build 🚀
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded shadow text-xs font-mono border border-gray-200 pointer-events-none">
         <div className="flex flex-col gap-1">
             <div className="flex gap-3">
                <span>Mode: <span className="font-bold uppercase text-blue-600">{activeTool}</span></span>
                <span>Walls: {walls.length}</span>
                <span>Zoom: {Math.round(viewState.zoom)}px/m</span>
             </div>
             <div className="text-gray-500 italic border-t border-gray-100 pt-1 mt-1">
                Scroll to Zoom • Middle-Click to Pan • <button className="underline pointer-events-auto cursor-pointer hover:text-blue-600" onClick={() => setShowHelp(true)}>Help</button>
             </div>
         </div>
      </div>
    </div>
  );
};
