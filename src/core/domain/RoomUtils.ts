import type { Project, Room, EntityId } from './types';
import type { Vector2 } from '../geometry/types';

export const RoomUtils = {
  getPolygon(project: Project, room: Room): Vector2[] {
    if (!room.boundaryWallIds || room.boundaryWallIds.length === 0) return [];

    const nodes: Vector2[] = [];
    const wallIds = room.boundaryWallIds;

    // We need to trace the walls to find the ordered vertices.
    // RoomFinder returns walls in traversal order, but we need to check direction.
    
    // Start with the first wall. 
    // We need to determine which node of the first wall connects to the second wall.
    // If there is only 1 wall (impossible for room), return empty.
    
    // Naively assume the list is ordered such that W[i] connects to W[i+1]
    
    // Let's look at Wall 0 and Wall 1. Find the shared node.
    // That shared node is vertex 1. The other node of Wall 0 is vertex 0.
    
    // If there are only 2 walls, it's not a room (checked elsewhere).
    
    let previousNodeId: EntityId | null = null;
    
    // Special handling for the start to ensure we pick the correct direction
    const w0 = project.walls[wallIds[0]];
    const w1 = project.walls[wallIds[1]];
    
    if (!w0 || !w1) return [];

    // Find shared node between w0 and w1 to establish direction
    const sharedWithNext = (w0.startNodeId === w1.startNodeId || w0.startNodeId === w1.endNodeId)
      ? w0.startNodeId
      : (w0.endNodeId === w1.startNodeId || w0.endNodeId === w1.endNodeId)
        ? w0.endNodeId
        : null;

    if (!sharedWithNext) {
        // Disconnected walls in list? Should not happen if RoomFinder is correct.
        return [];
    }

    // So the order for W0 is: (The Other Node) -> (Shared Node)
    const startNodeId = (w0.startNodeId === sharedWithNext) ? w0.endNodeId : w0.startNodeId;
    
    const startNode = project.nodes[startNodeId];
    if(startNode) nodes.push({ x: startNode.x, y: startNode.y });
    
    const sharedNode = project.nodes[sharedWithNext];
    if(sharedNode) nodes.push({ x: sharedNode.x, y: sharedNode.y });

    previousNodeId = sharedWithNext;

    // Now iterate from w1 onwards
    for (let i = 1; i < wallIds.length - 1; i++) {
        // We know we arrived at previousNodeId.
        // The current wall is wallIds[i].
        // It should contain previousNodeId and a new node.
        const w = project.walls[wallIds[i]];
        if (!w) continue;
        
        const nextNodeId: string = (w.startNodeId === previousNodeId) ? w.endNodeId : w.startNodeId;
        
        // Safety check: did we actually match?
        if (nextNodeId === previousNodeId) {
             // This implies w.start == w.end ?? 
             // Or we didn't match previous.
             // If w.start != prev and w.end != prev, we have a gap.
             if (w.startNodeId !== previousNodeId && w.endNodeId !== previousNodeId) {
                 // Disconnected
                 return nodes;
             }
        }
        
        const node = project.nodes[nextNodeId];
        if (node) nodes.push({ x: node.x, y: node.y });
        
        previousNodeId = nextNodeId;
    }

    // The last wall should connect back to startNodeId, which we already have as the first point.
    // We don't need to push it again for a closed polygon in SVG usually, 
    // but having the last vertex (end of last wall) is good if it's not already there.
    // Our loop went up to length-1.
    
    // Actually, distinct vertices count = wall count.
    
    return nodes;
  },
  
  // Create an SVG path string
  toSvgPath(points: Vector2[]): string {
      if (points.length === 0) return '';
      return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
  }
};
