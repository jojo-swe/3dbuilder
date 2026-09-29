import type { EntityId, MaterialType, Node, Opening, Wall } from '../../core/domain/types';
import { planToGround, wallAngleY, type Vec3 } from './coordinates';

/** The kind of box that makes up a rendered wall. */
export type WallPartKind = 'solid' | 'sill' | 'lintel' | 'glass';

/** A single box within a wall group, expressed in the group's local space. */
export interface WallPart {
  kind: WallPartKind;
  /** Position in the wall group's local frame (group centred on the midpoint, `+X` along the wall). */
  position: [number, number, number];
  /** Box dimensions `[lengthAlongWall, height, thickness]`. */
  size: [number, number, number];
  color: string;
  opacity: number;
  transparent: boolean;
}

/** Deterministic description of a wall ready to be instantiated as Three.js meshes. */
export interface WallRenderData {
  wallId: EntityId;
  /** World position of the wall group (on the ground plane, `Y = 0`). */
  midpoint: Vec3;
  /** Rotation of the wall group about the world Y axis. */
  rotationY: number;
  /** Wall length in meters. */
  length: number;
  parts: WallPart[];
}

const PLASTER_COLOR = '#e5e7eb';
const BRICK_COLOR = '#9f4444';
const WOOD_COLOR = '#d4a373';
const GLASS_COLOR = '#bfdbfe';
const GLASS_OPACITY = 0.3;
const GLASS_DEPTH_RATIO = 0.6;
const MIN_SEGMENT = 0.01;

/** Resolves a wall material to its rendered surface colour. */
export function materialColor(material?: MaterialType): string {
  switch (material) {
    case 'brick_red':
      return BRICK_COLOR;
    case 'wood_panel':
      return WOOD_COLOR;
    default:
      return PLASTER_COLOR;
  }
}

function solidPart(centerAlong: number, length: number, wall: Wall, color: string): WallPart {
  return {
    kind: 'solid',
    position: [centerAlong - length / 2, wall.height / 2, 0],
    size: [/* filled by caller */ 0, wall.height, wall.thickness],
    color,
    opacity: 1,
    transparent: false,
  };
}

/**
 * Converts a wall (centerline + thickness + height) and its openings into a
 * deterministic set of boxes. Pure function: no Three.js, no React.
 *
 * The wall is split lengthwise into solid segments around each opening, with a
 * sill below and a lintel above the opening void, plus a translucent glass
 * placeholder for the door/window itself.
 */
export function buildWallRenderData(
  wall: Wall,
  startNode: Node | undefined,
  endNode: Node | undefined,
  openings: Opening[],
): WallRenderData | null {
  if (!startNode || !endNode) return null;

  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_SEGMENT) return null;

  const midpoint = planToGround({
    x: (startNode.x + endNode.x) / 2,
    y: (startNode.y + endNode.y) / 2,
  });
  const rotationY = wallAngleY(startNode, endNode);
  const color = materialColor(wall.material);

  const parts: WallPart[] = [];
  // Openings that stick out past either end of the wall would produce negative-length
  // or overhanging boxes, so they are skipped rather than rendered.
  const sorted = openings
    .filter(op => op.distFromStart - op.width / 2 >= 0 && op.distFromStart + op.width / 2 <= length)
    .sort((a, b) => a.distFromStart - b.distFromStart);

  let currentDist = 0;
  for (const op of sorted) {
    const opStart = op.distFromStart - op.width / 2;

    const solidLen = opStart - currentDist;
    if (solidLen > MIN_SEGMENT) {
      const part = solidPart(currentDist + solidLen / 2, length, wall, color);
      part.size[0] = solidLen;
      parts.push(part);
    }

    const opCenterAlong = opStart + op.width / 2 - length / 2;

    if (op.altitude > MIN_SEGMENT) {
      parts.push({
        kind: 'sill',
        position: [opCenterAlong, op.altitude / 2, 0],
        size: [op.width, op.altitude, wall.thickness],
        color,
        opacity: 1,
        transparent: false,
      });
    }

    const topStartH = op.altitude + op.height;
    const topH = wall.height - topStartH;
    if (topH > MIN_SEGMENT) {
      parts.push({
        kind: 'lintel',
        position: [opCenterAlong, topStartH + topH / 2, 0],
        size: [op.width, topH, wall.thickness],
        color,
        opacity: 1,
        transparent: false,
      });
    }

    parts.push({
      kind: 'glass',
      position: [opCenterAlong, op.altitude + op.height / 2, 0],
      size: [op.width, op.height, wall.thickness * GLASS_DEPTH_RATIO],
      color: GLASS_COLOR,
      opacity: GLASS_OPACITY,
      transparent: true,
    });

    currentDist = op.distFromStart + op.width / 2;
  }

  const remaining = length - currentDist;
  if (remaining > MIN_SEGMENT) {
    const part = solidPart(currentDist + remaining / 2, length, wall, color);
    part.size[0] = remaining;
    parts.push(part);
  }

  return { wallId: wall.id, midpoint, rotationY, length, parts };
}
