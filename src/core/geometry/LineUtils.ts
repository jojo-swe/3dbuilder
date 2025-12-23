import type { LineSegment, Vector2 } from './types';
import { EPSILON } from './types';
import { Vector2Math } from './Vector2Math';

export const LineSegmentMath = {
  length(line: LineSegment): number {
    return Vector2Math.distance(line.start, line.end);
  },

  // Project point p onto line segment ab
  closestPoint(line: LineSegment, p: Vector2): Vector2 {
    const ab = Vector2Math.subtract(line.end, line.start);
    const ap = Vector2Math.subtract(p, line.start);
    const lenSq = Vector2Math.dot(ab, ab);
    
    if (lenSq < EPSILON) return line.start;

    const t = Math.max(0, Math.min(1, Vector2Math.dot(ap, ab) / lenSq));
    return Vector2Math.add(line.start, Vector2Math.scale(ab, t));
  },

  // Check if two segments intersect. Returns intersection point or null.
  intersection(l1: LineSegment, l2: LineSegment): Vector2 | null {
    const p = l1.start;
    const r = Vector2Math.subtract(l1.end, l1.start);
    const q = l2.start;
    const s = Vector2Math.subtract(l2.end, l2.start);

    const rxs = Vector2Math.cross(r, s);
    // qpxr was unused
    
    // Collinear or parallel
    if (Math.abs(rxs) < EPSILON) {
      return null; 
    }

    const t = Vector2Math.cross(Vector2Math.subtract(q, p), s) / rxs;
    const u = Vector2Math.cross(Vector2Math.subtract(q, p), r) / rxs;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return Vector2Math.add(p, Vector2Math.scale(r, t));
    }

    return null;
  }
};
