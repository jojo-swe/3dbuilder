import type { EntityId, Room } from '../../core/domain/types';
import type { Vector2 } from '../../core/geometry/types';

/** Small vertical offset for floor meshes to avoid z-fighting with the grid. */
export const FLOOR_ELEVATION = 0.01;
/** Rotation about X that lays a flat shape onto the ground plane. */
export const FLOOR_ROTATION_X = -Math.PI / 2;
/** Default floor surface colour. */
export const FLOOR_COLOR = '#9ca3af';

/** Deterministic description of a floor ready to be instantiated as a Three.js mesh. */
export interface FloorRenderData {
  roomId: EntityId;
  /**
   * Polygon vertices in the flat shape's 2D coordinate space. The plan `y` is
   * negated so that, once the shape is rotated `-90°` about X onto the ground,
   * it maps to `-y -> Z` consistently with wall placement.
   */
  shapePoints: Vector2[];
}

/** Maps floor-plan polygon vertices into the flat floor shape space (`y -> -y`). */
export function buildFloorShapePoints(polygon: Vector2[]): Vector2[] {
  return polygon.map((p) => ({ x: p.x, y: p.y === 0 ? 0 : -p.y }));
}

/**
 * Converts a detected room polygon into deterministic floor render data. Pure
 * function: no Three.js, no React. Returns `null` for degenerate polygons.
 */
export function buildFloorRenderData(room: Room, polygon: Vector2[]): FloorRenderData | null {
  if (polygon.length < 3) return null;
  return { roomId: room.id, shapePoints: buildFloorShapePoints(polygon) };
}
