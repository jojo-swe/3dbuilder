import React, { useMemo } from 'react';
import { useEditorStore } from '../../core/state/store';
import { RoomUtils } from '../../core/domain/RoomUtils';
import * as THREE from 'three';
import type { Project, Wall, Room } from '../../core/domain/types';

// Wall Component
const WallMesh: React.FC<{ wall: Wall; project: Project }> = ({ wall, project }) => {
    const startNode = project.nodes[wall.startNodeId];
    const endNode = project.nodes[wall.endNodeId];
    
    if (!startNode || !endNode) return null;

    const start = new THREE.Vector3(startNode.x, 0, -startNode.y); 
    const end = new THREE.Vector3(endNode.x, 0, -endNode.y);
    const length = start.distanceTo(end);
    
    const angle = Math.atan2(-(endNode.y - startNode.y), endNode.x - startNode.x);
    
    // Find openings for this wall
    const wallOpenings = Object.values(project.openings)
        .filter(op => op.wallId === wall.id)
        .sort((a, b) => a.distFromStart - b.distFromStart);
        
    let materialColor = "#e5e7eb";
    if (wall.material === 'brick_red') materialColor = "#9f4444";
    if (wall.material === 'wood_panel') materialColor = "#d4a373";

    // Algorithm: Iterate through the wall length, switching between Solid and Opening segments
    let currentDist = 0;
    
    // We'll store the mesh parts here
    const parts: any[] = [];
    
    wallOpenings.forEach(op => {
        // Solid segment before opening
        const solidLen = op.distFromStart - (op.width / 2) - currentDist;
        if (solidLen > 0.01) {
             const centerDist = currentDist + solidLen / 2;
             parts.push(
                 <mesh 
                    key={`wall-seg-${currentDist}`}
                    position={[centerDist - length/2, wall.height/2, 0]}
                    castShadow receiveShadow
                 >
                     <boxGeometry args={[solidLen, wall.height, wall.thickness]} />
                     <meshStandardMaterial color={materialColor} roughness={0.5} />
                 </mesh>
             );
        }
        
        // Opening segment (Top and Bottom only)
        const opStart = op.distFromStart - (op.width / 2);
        
        // Bottom (Sill)
        if (op.altitude > 0.01) {
            parts.push(
                <mesh 
                   key={`wall-sill-${op.id}`}
                   position={[opStart + op.width/2 - length/2, op.altitude/2, 0]}
                   castShadow receiveShadow
                >
                    <boxGeometry args={[op.width, op.altitude, wall.thickness]} />
                    <meshStandardMaterial color={materialColor} roughness={0.5} />
                </mesh>
            );
        }
        
        // Top (Lintel)
        const topStartH = op.altitude + op.height;
        const topH = wall.height - topStartH;
        if (topH > 0.01) {
            parts.push(
                <mesh 
                   key={`wall-lintel-${op.id}`}
                   position={[opStart + op.width/2 - length/2, topStartH + topH/2, 0]}
                   castShadow receiveShadow
                >
                    <boxGeometry args={[op.width, topH, wall.thickness]} />
                    <meshStandardMaterial color={materialColor} roughness={0.5} />
                </mesh>
            );
        }
        
        // Render the actual Window/Door Object (Glass/Frame)
        // Simple placeholder for now
        if (op.type === 'window' || op.type === 'door') {
             parts.push(
                <group key={`prop-${op.id}`} position={[opStart + op.width/2 - length/2, op.altitude, 0]}>
                    {/* Frame */}
                    <mesh position={[0, op.height/2, 0]}>
                       <boxGeometry args={[op.width, op.height, wall.thickness * 0.6]} />
                       <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.1} />
                    </mesh>
                    {/* Cross bar if window? */}
                </group>
             );
        }
        
        currentDist = op.distFromStart + op.width / 2;
    });
    
    // Final solid segment
    const remaining = length - currentDist;
    if (remaining > 0.01) {
         const centerDist = currentDist + remaining / 2;
         parts.push(
             <mesh 
                key={`wall-end-${currentDist}`}
                position={[centerDist - length/2, wall.height/2, 0]}
                castShadow receiveShadow
             >
                 <boxGeometry args={[remaining, wall.height, wall.thickness]} />
                 <meshStandardMaterial color={materialColor} roughness={0.5} />
             </mesh>
         );
    }

    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    return (
        <group position={[midpoint.x, 0, midpoint.z]} rotation={[0, -angle, 0]}>
            {parts}
        </group>
    );
};

// Room Component
const RoomMesh: React.FC<{ room: Room; project: Project }> = ({ room, project }) => {
    const poly = RoomUtils.getPolygon(project, room);
    
    const shape = useMemo(() => {
        if (poly.length < 3) return null;
        const s = new THREE.Shape();
        s.moveTo(poly[0].x, -poly[0].y); 
        for (let i = 1; i < poly.length; i++) {
            s.lineTo(poly[i].x, -poly[i].y);
        }
        s.closePath();
        return s;
    }, [poly]);

    if (!shape) return null;

    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.01, 0]} 
            receiveShadow
        >
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial color="#9ca3af" side={THREE.DoubleSide} />
        </mesh>
    );
};

export const BuildingModel: React.FC = () => {
  const project = useEditorStore(state => state.project);
  const walls = Object.values(project.walls);
  const rooms = Object.values(project.rooms);
  
  return (
    <group>
        {walls.map(wall => (
            <WallMesh key={wall.id} wall={wall} project={project} />
        ))}
        {rooms.map(room => (
            <RoomMesh key={room.id} room={room} project={project} />
        ))}
    </group>
  );
};
