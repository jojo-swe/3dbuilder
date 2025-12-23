import type { Project } from './types';
import { RoomFinder } from '../geometry/RoomFinder';
import { PolygonUtils } from '../geometry/PolygonUtils';

export interface RoomCalculation {
  wallIds: string[];
  area: number; // m2
  perimeter: number; // m
}

export const AreaService = {
  calculateAreas(project: Project): { totalArea: number; rooms: RoomCalculation[] } {
    const loops = RoomFinder.findRooms(project.nodes, project.walls);
    
    const rooms: RoomCalculation[] = loops.map(wallIds => {
        const points = wallIds.map(wId => {
             const wall = project.walls[wId];
             // Note: detailed logic would need to trace start->end order correctly
             // For now we assume the room finder returns ordered walls, 
             // but we need the correct vertex order.
             const node = project.nodes[wall.startNodeId];
             return {x: node.x, y: node.y}; 
        });
        
        // Refinement: RoomFinder returns walls. We really need ordered vertices.
        // But for Area Shoelace, startNode of ordered walls is usually correct if they are head-to-tail.
        // RoomFinder logic traces `endNode -> startNode` (or vice versa).
        
        return {
            wallIds,
            area: PolygonUtils.area(points),
            perimeter: 0 // TODO calculate
        };
    });
    
    return {
        totalArea: rooms.reduce((sum, r) => sum + r.area, 0),
        rooms
    };
  }
};
