import type { Vector2 } from '../../core/geometry/types';

/** A point in Three.js world space. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Normalizes `-0` to `0` so mapped coordinates compare cleanly. */
function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Maps a 2D floor-plan point onto the Three.js ground plane (`Y = 0`).
 *
 * The floor plan is the single source of truth; 3D is a derived view. The
 * documented mapping (see CLAUDE.md) is `x -> X` and `-y -> Z`, inverting the
 * SVG Y-down axis so the plan reads correctly when viewed from above.
 */
export function planToGround(point: Vector2): Vec3 {
  return { x: point.x, y: 0, z: normalizeZero(-point.y) };
}

/**
 * Maps a 2D floor-plan point to a 3D world point at the given vertical height.
 * `x -> X`, `-y -> Z`, and the extrusion `height -> Y`.
 */
export function planToWorld(point: Vector2, height = 0): Vec3 {
  return { x: point.x, y: height, z: normalizeZero(-point.y) };
}

/**
 * Rotation (radians) about the world Y axis that aligns a wall group's local
 * `+X` axis with the wall centerline direction in world space.
 *
 * Equivalent to `-atan2(-(dy), dx)` used by the legacy inline renderer, which
 * simplifies to `atan2(dy, dx)` because `atan2` is odd in its first argument.
 */
export function wallAngleY(start: Vector2, end: Vector2): number {
  return Math.atan2(end.y - start.y, end.x - start.x);
}
