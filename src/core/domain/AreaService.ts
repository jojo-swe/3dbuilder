import type { Project } from './types';
import { RoomFinder } from '../geometry/RoomFinder';
import { PolygonUtils } from '../geometry/PolygonUtils';
import { Vector2Math } from '../geometry/Vector2Math';

export interface RoomCalculation {
  wallIds: string[];
  area: number; // m2
  perimeter: number; // m
}

export const AreaService = {
  calculateAreas(project: Project): { totalArea: number; rooms: RoomCalculation[] } {
    const loops = RoomFinder.findRooms(project.nodes, project.walls);
    
    const rooms: RoomCalculation[] = loops.map(wallIds => {
        const vertices: {x: number, y: number}[] = [];
        let perimeter = 0;

        for (let i = 0; i < wallIds.length; i++) {
            const wId = wallIds[i];
            const wall = project.walls[wId];
            
            // Calculate Length
            const nStart = project.nodes[wall.startNodeId];
            const nEnd = project.nodes[wall.endNodeId];
            const len = Vector2Math.distance(
                {x: nStart.x, y: nStart.y}, 
                {x: nEnd.x, y: nEnd.y}
            );
            perimeter += len;

            // Find Vertex (Corner)
            // We need the vertex connecting to the NEXT wall to build the ordered polygon.
            const nextWId = wallIds[(i + 1) % wallIds.length];
            const nextWall = project.walls[nextWId];

            let cornerNodeId: string | null = null;
            
            // Check connectivity
            // w1 could be s->e or e->s
            // w2 could be s->e or e->s
            // We want the node shared by current wall and next wall.
            if (wall.endNodeId === nextWall.startNodeId || wall.endNodeId === nextWall.endNodeId) {
                cornerNodeId = wall.endNodeId;
            } else if (wall.startNodeId === nextWall.startNodeId || wall.startNodeId === nextWall.endNodeId) {
                cornerNodeId = wall.startNodeId;
            }

            if (cornerNodeId) {
                const node = project.nodes[cornerNodeId];
                vertices.push({x: node.x, y: node.y});
            }
        }
        
        return {
            wallIds,
            area: PolygonUtils.area(vertices),
            perimeter
        };
    });
    
    return {
        totalArea: rooms.reduce((sum, r) => sum + r.area, 0),
        rooms
    };
  }
};