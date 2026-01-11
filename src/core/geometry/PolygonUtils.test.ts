import { describe, it, expect } from 'vitest';
import { PolygonUtils } from './PolygonUtils';

describe('PolygonUtils', () => {
  describe('area', () => {
    it('should calculate area of a unit square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];
      expect(PolygonUtils.area(square)).toBeCloseTo(1);
    });

    it('should calculate area of a 10x10 square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      expect(PolygonUtils.area(square)).toBeCloseTo(100);
    });

    it('should calculate area of a rectangle', () => {
      const rect = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 3 },
        { x: 0, y: 3 }
      ];
      expect(PolygonUtils.area(rect)).toBeCloseTo(15);
    });

    it('should calculate area of a triangle', () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 2, y: 3 }
      ];
      // Area = 0.5 * base * height = 0.5 * 4 * 3 = 6
      expect(PolygonUtils.area(triangle)).toBeCloseTo(6);
    });

    it('should return positive area regardless of winding order', () => {
      const ccwSquare = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];
      const cwSquare = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 }
      ];
      expect(PolygonUtils.area(ccwSquare)).toBeCloseTo(1);
      expect(PolygonUtils.area(cwSquare)).toBeCloseTo(1);
    });

    it('should return 0 for degenerate polygon (line)', () => {
      const line = [
        { x: 0, y: 0 },
        { x: 5, y: 5 }
      ];
      expect(PolygonUtils.area(line)).toBeCloseTo(0);
    });

    it('should return 0 for empty polygon', () => {
      expect(PolygonUtils.area([])).toBeCloseTo(0);
    });

    it('should handle L-shaped polygon', () => {
      // L-shape: 3x3 square with 1x1 corner cut out
      const lShape = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 }
      ];
      // Area = 2*1 + 1*1 = 3
      expect(PolygonUtils.area(lShape)).toBeCloseTo(3);
    });
  });

  describe('isClockwise', () => {
    it('should return true for clockwise square', () => {
      const cwSquare = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 }
      ];
      expect(PolygonUtils.isClockwise(cwSquare)).toBe(true);
    });

    it('should return false for counter-clockwise square', () => {
      const ccwSquare = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];
      expect(PolygonUtils.isClockwise(ccwSquare)).toBe(false);
    });

    it('should return true for clockwise triangle', () => {
      const cwTriangle = [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 0 }
      ];
      expect(PolygonUtils.isClockwise(cwTriangle)).toBe(true);
    });

    it('should return false for counter-clockwise triangle', () => {
      const ccwTriangle = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 2 }
      ];
      expect(PolygonUtils.isClockwise(ccwTriangle)).toBe(false);
    });
  });
});
