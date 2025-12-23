import type { Vector2 } from './types';
import { EPSILON } from './types';

export const Vector2Math = {
  create(x: number, y: number): Vector2 {
    return { x, y };
  },

  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  scale(v: Vector2, s: number): Vector2 {
    return { x: v.x * s, y: v.y * s };
  },

  magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  distance(a: Vector2, b: Vector2): number {
    return this.magnitude(this.subtract(a, b));
  },

  normalize(v: Vector2): Vector2 {
    const m = this.magnitude(v);
    if (m < EPSILON) return { x: 0, y: 0 };
    return this.scale(v, 1 / m);
  },

  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  },

  equals(a: Vector2, b: Vector2, tolerance: number = EPSILON): boolean {
    return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
  },

  lengthSq: (v: Vector2): number => v.x * v.x + v.y * v.y,
  
  closestPointOnSegment: (a: Vector2, b: Vector2, p: Vector2): Vector2 => {
    const ab = Vector2Math.subtract(b, a);
    const ap = Vector2Math.subtract(p, a);
    const lenSq = Vector2Math.lengthSq(ab);
    if (lenSq === 0) return a;
    
    let t = Vector2Math.dot(ap, ab) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    return Vector2Math.add(a, Vector2Math.scale(ab, t));
  },

  angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  },

  snap: (v: Vector2, gridSize: number): Vector2 => ({
    x: Math.round(v.x / gridSize) * gridSize,
    y: Math.round(v.y / gridSize) * gridSize,
  })
};
