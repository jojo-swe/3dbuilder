import { v4 as uuidv4 } from 'uuid';
import type { Node, Wall, EntityId } from './types';

/**
 * Creates a new Node entity.
 * @param x - X coordinate in meters
 * @param y - Y coordinate in meters
 * @returns A new Node object with a unique ID
 */
export function createNode(x: number, y: number): Node {
  return {
    id: uuidv4(),
    x,
    y
  };
}

/**
 * Creates a new Wall entity.
 * @param startNodeId - ID of the start node
 * @param endNodeId - ID of the end node
 * @param thickness - Wall thickness in meters (default: 0.2)
 * @param height - Wall height in meters (default: 2.5)
 * @returns A new Wall object with a unique ID
 * @throws Error if dimensions are non-positive or nodes are identical
 */
export function createWall(
  startNodeId: EntityId,
  endNodeId: EntityId,
  thickness: number = 0.2,
  height: number = 2.5
): Wall {
  if (thickness <= 0) {
    throw new Error("Wall thickness must be positive");
  }
  if (height <= 0) {
    throw new Error("Wall height must be positive");
  }
  if (startNodeId === endNodeId) {
    throw new Error("Wall must have different start and end nodes");
  }

  return {
    id: uuidv4(),
    startNodeId,
    endNodeId,
    thickness,
    height
  };
}
