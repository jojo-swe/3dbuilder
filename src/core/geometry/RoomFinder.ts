import type { EntityId, Wall, Node } from '../domain/types';
import { Vector2Math } from './Vector2Math';
// import type { Vector2 } from './types'; // Removed unused

// GraphNode interface removed as it was unused

interface DirectedEdge {
  wallId: EntityId;
  startNodeId: EntityId;
  endNodeId: EntityId;
  angle: number; // Angle of the edge leaving startNode
}

/**
 * Finds all closed loops (rooms) in the wall graph.
 * Uses the "Left Hand Rule" (or specific winding) to find smallest cycles.
 */
export const RoomFinder = {
  findRooms(
    nodes: Record<EntityId, Node>,
    walls: Record<EntityId, Wall>
  ): EntityId[][] { // Returns lists of Wall IDs forming loops
    
    // 1. Build adjacency list with directed edges
    const adj: Record<EntityId, DirectedEdge[]> = {};
    
    // Initialize
    Object.keys(nodes).forEach(id => adj[id] = []);

    // Populate
    Object.values(walls).forEach(wall => {
      const n1 = nodes[wall.startNodeId];
      const n2 = nodes[wall.endNodeId];
      if (!n1 || !n2) return;

      const v1 = { x: n1.x, y: n1.y };
      const v2 = { x: n2.x, y: n2.y };

      // Edge start -> end
      const dir1 = Vector2Math.subtract(v2, v1);
      adj[wall.startNodeId].push({
        wallId: wall.id,
        startNodeId: wall.startNodeId,
        endNodeId: wall.endNodeId,
        angle: Math.atan2(dir1.y, dir1.x)
      });

      // Edge end -> start
      const dir2 = Vector2Math.subtract(v1, v2);
      adj[wall.endNodeId].push({
        wallId: wall.id,
        startNodeId: wall.endNodeId,
        endNodeId: wall.startNodeId,
        angle: Math.atan2(dir2.y, dir2.x)
      });
    });

    // Sort edges by angle at each node to simplify "turn left" lookup
    Object.values(adj).forEach(edges => {
      edges.sort((a, b) => a.angle - b.angle);
    });

    const loops: EntityId[][] = [];
    const visitedEdges = new Set<string>(); // "startId->endId"

    // 2. Traverse
    for (const startNodeId of Object.keys(nodes)) {
      const edges = adj[startNodeId];
      for (const edge of edges) {
        const edgeKey = `${edge.startNodeId}->${edge.endNodeId}`;
        if (visitedEdges.has(edgeKey)) continue;

        // Trace a potential loop
        const pathWalls: EntityId[] = [];
        let currNodeId = edge.endNodeId;
        let prevNodeId = startNodeId;
        const startEdgeKey = edgeKey;
        
        pathWalls.push(edge.wallId);
        visitedEdges.add(edgeKey);

        let safety = 0;
        let closed = false;

        while (safety < 1000) { // Limit for safety
            if (currNodeId === startNodeId) {
                closed = true;
                break;
            }

            const available = adj[currNodeId];
            if (available.length < 2) break; // Dead end

            // Find the edge that connects back to prevNodeId
            const backEdgeIndex = available.findIndex(e => e.endNodeId === prevNodeId);
            
            if (backEdgeIndex === -1) break; // Should not happen if graph consistent

            // We want the next edge in the sorted list (CCW winding)
            // Indices wrap around.
            const nextEdgeIndex = (backEdgeIndex + 1) % available.length;
            const nextEdge = available[nextEdgeIndex];

            const nextKey = `${nextEdge.startNodeId}->${nextEdge.endNodeId}`;
            if (visitedEdges.has(nextKey)) {
                // Determine if this is a failure or just hitting a known path
                // If it hits the START edge, it's a loop.
                if (nextKey === startEdgeKey) {
                    closed = true;
                    break;
                }
                // Otherwise we merged into another loop or messed up
                break;
            }

            pathWalls.push(nextEdge.wallId);
            visitedEdges.add(nextKey);
            
            prevNodeId = currNodeId;
            currNodeId = nextEdge.endNodeId;
            safety++;
        }

        if (closed && pathWalls.length > 2) {
            loops.push(pathWalls);
        }
      }
    }

    return loops;
  }
};
