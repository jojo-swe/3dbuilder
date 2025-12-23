import { Vector2 } from './types';
import { Node } from '../domain/types';
import { Vector2Math } from './Vector2Math';

/**
 * Snaps a given point to the closest node if it is within tolerance.
 * @param point - The point to snap
 * @param nodes - Array of nodes to test against
 * @param tolerance - Maximum distance to snap
 * @returns The coordinates of the closest node or the original point
 */
export function snapPointToNodes(point: Vector2, nodes: Node[], tolerance: number): Vector2 {
  let closestNode: Node | null = null;
  let minDistance = tolerance;

  for (const node of nodes) {
    const nodePos: Vector2 = { x: node.x, y: node.y };
    const dist = Vector2Math.distance(point, nodePos);

    if (dist <= minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  }

  if (closestNode) {
    return { x: closestNode.x, y: closestNode.y };
  }

  return point;
}