import { describe, it, expect } from 'vitest';
import { Vector2Math } from './Vector2Math';

describe('Vector2Math', () => {
  describe('create', () => {
    it('should create a vector with given coordinates', () => {
      const v = Vector2Math.create(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result = Vector2Math.add(a, b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should handle negative values', () => {
      const a = { x: 5, y: 3 };
      const b = { x: -2, y: -1 };
      const result = Vector2Math.add(a, b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(2);
    });
  });

  describe('subtract', () => {
    it('should subtract two vectors', () => {
      const a = { x: 5, y: 7 };
      const b = { x: 2, y: 3 };
      const result = Vector2Math.subtract(a, b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
  });

  describe('scale', () => {
    it('should scale a vector by a scalar', () => {
      const v = { x: 2, y: 3 };
      const result = Vector2Math.scale(v, 2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should handle negative scalars', () => {
      const v = { x: 2, y: 3 };
      const result = Vector2Math.scale(v, -1);
      expect(result.x).toBe(-2);
      expect(result.y).toBe(-3);
    });

    it('should handle zero scalar', () => {
      const v = { x: 2, y: 3 };
      const result = Vector2Math.scale(v, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('magnitude', () => {
    it('should calculate magnitude of a 3-4-5 triangle', () => {
      const v = { x: 3, y: 4 };
      expect(Vector2Math.magnitude(v)).toBeCloseTo(5);
    });

    it('should return 0 for zero vector', () => {
      const v = { x: 0, y: 0 };
      expect(Vector2Math.magnitude(v)).toBe(0);
    });

    it('should handle unit vectors', () => {
      const v = { x: 1, y: 0 };
      expect(Vector2Math.magnitude(v)).toBe(1);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(Vector2Math.distance(a, b)).toBeCloseTo(5);
    });

    it('should return 0 for same point', () => {
      const a = { x: 5, y: 5 };
      expect(Vector2Math.distance(a, a)).toBe(0);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const v = { x: 3, y: 4 };
      const result = Vector2Math.normalize(v);
      expect(Vector2Math.magnitude(result)).toBeCloseTo(1);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
    });

    it('should return zero vector for zero input', () => {
      const v = { x: 0, y: 0 };
      const result = Vector2Math.normalize(v);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('dot', () => {
    it('should calculate dot product', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      expect(Vector2Math.dot(a, b)).toBe(11); // 1*3 + 2*4 = 11
    });

    it('should return 0 for perpendicular vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 0, y: 1 };
      expect(Vector2Math.dot(a, b)).toBe(0);
    });
  });

  describe('cross', () => {
    it('should calculate 2D cross product (z-component)', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 0, y: 1 };
      expect(Vector2Math.cross(a, b)).toBe(1); // 1*1 - 0*0 = 1
    });

    it('should return negative for reversed order', () => {
      const a = { x: 0, y: 1 };
      const b = { x: 1, y: 0 };
      expect(Vector2Math.cross(a, b)).toBe(-1);
    });
  });

  describe('equals', () => {
    it('should return true for identical vectors', () => {
      const a = { x: 1.5, y: 2.5 };
      const b = { x: 1.5, y: 2.5 };
      expect(Vector2Math.equals(a, b)).toBe(true);
    });

    it('should return true for vectors within tolerance', () => {
      const a = { x: 1.0, y: 2.0 };
      const b = { x: 1.00001, y: 2.00001 };
      expect(Vector2Math.equals(a, b)).toBe(true);
    });

    it('should return false for vectors outside tolerance', () => {
      const a = { x: 1.0, y: 2.0 };
      const b = { x: 1.1, y: 2.1 };
      expect(Vector2Math.equals(a, b)).toBe(false);
    });

    it('should respect custom tolerance', () => {
      const a = { x: 1.0, y: 2.0 };
      const b = { x: 1.05, y: 2.05 };
      expect(Vector2Math.equals(a, b, 0.1)).toBe(true);
      expect(Vector2Math.equals(a, b, 0.01)).toBe(false);
    });
  });

  describe('lengthSq', () => {
    it('should calculate squared length', () => {
      const v = { x: 3, y: 4 };
      expect(Vector2Math.lengthSq(v)).toBe(25); // 9 + 16
    });
  });

  describe('closestPointOnSegment', () => {
    it('should return start point when closest', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      const p = { x: -5, y: 0 };
      const result = Vector2Math.closestPointOnSegment(a, b, p);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(0);
    });

    it('should return end point when closest', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      const p = { x: 15, y: 0 };
      const result = Vector2Math.closestPointOnSegment(a, b, p);
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(0);
    });

    it('should return midpoint projection', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      const p = { x: 5, y: 5 };
      const result = Vector2Math.closestPointOnSegment(a, b, p);
      expect(result.x).toBeCloseTo(5);
      expect(result.y).toBeCloseTo(0);
    });

    it('should handle zero-length segment', () => {
      const a = { x: 5, y: 5 };
      const b = { x: 5, y: 5 };
      const p = { x: 10, y: 10 };
      const result = Vector2Math.closestPointOnSegment(a, b, p);
      expect(result.x).toBeCloseTo(5);
      expect(result.y).toBeCloseTo(5);
    });
  });

  describe('angle', () => {
    it('should return 0 for positive x direction', () => {
      const v = { x: 1, y: 0 };
      expect(Vector2Math.angle(v)).toBeCloseTo(0);
    });

    it('should return PI/2 for positive y direction', () => {
      const v = { x: 0, y: 1 };
      expect(Vector2Math.angle(v)).toBeCloseTo(Math.PI / 2);
    });

    it('should return PI for negative x direction', () => {
      const v = { x: -1, y: 0 };
      expect(Math.abs(Vector2Math.angle(v))).toBeCloseTo(Math.PI);
    });

    it('should return -PI/2 for negative y direction', () => {
      const v = { x: 0, y: -1 };
      expect(Vector2Math.angle(v)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('snap', () => {
    it('should snap to grid', () => {
      const v = { x: 0.27, y: 0.73 };
      const result = Vector2Math.snap(v, 0.5);
      expect(result.x).toBeCloseTo(0.5);
      expect(result.y).toBeCloseTo(0.5);
    });

    it('should snap to smaller grid', () => {
      const v = { x: 0.24, y: 0.36 };
      const result = Vector2Math.snap(v, 0.1);
      expect(result.x).toBeCloseTo(0.2);
      expect(result.y).toBeCloseTo(0.4);
    });

    it('should handle exact grid values', () => {
      const v = { x: 1.0, y: 2.0 };
      const result = Vector2Math.snap(v, 0.5);
      expect(result.x).toBeCloseTo(1.0);
      expect(result.y).toBeCloseTo(2.0);
    });
  });
});
