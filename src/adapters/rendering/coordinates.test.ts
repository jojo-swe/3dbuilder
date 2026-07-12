import { describe, it, expect } from 'vitest';
import { planToGround, planToWorld, wallAngleY } from './coordinates';

describe('coordinates', () => {
  describe('planToGround', () => {
    it('maps x -> X and -y -> Z on the ground plane (Y = 0)', () => {
      expect(planToGround({ x: 3, y: 4 })).toEqual({ x: 3, y: 0, z: -4 });
    });

    it('handles the origin', () => {
      expect(planToGround({ x: 0, y: 0 })).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('planToWorld', () => {
    it('maps x -> X, -y -> Z and height -> Y', () => {
      expect(planToWorld({ x: 2, y: 5 }, 2.4)).toEqual({ x: 2, y: 2.4, z: -5 });
    });

    it('defaults height to 0', () => {
      expect(planToWorld({ x: 1, y: 1 })).toEqual({ x: 1, y: 0, z: -1 });
    });
  });

  describe('wallAngleY', () => {
    it('is 0 for a wall along +x', () => {
      expect(wallAngleY({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0);
    });

    it('is +PI/2 for a wall along +y (plan) which maps to -Z', () => {
      expect(wallAngleY({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(Math.PI / 2);
    });

    it('is PI (or -PI) for a wall along -x', () => {
      expect(Math.abs(wallAngleY({ x: 0, y: 0 }, { x: -10, y: 0 }))).toBeCloseTo(Math.PI);
    });
  });
});
