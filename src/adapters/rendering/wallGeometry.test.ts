import { describe, it, expect } from 'vitest';
import { buildWallRenderData, materialColor } from './wallGeometry';
import { createNode, createWall } from '../../core/domain/DomainFactory';
import type { Opening } from '../../core/domain/types';

describe('wallGeometry', () => {
  describe('materialColor', () => {
    it('returns the plaster colour by default', () => {
      expect(materialColor(undefined)).toBe('#e5e7eb');
      expect(materialColor('plaster_white')).toBe('#e5e7eb');
    });

    it('returns distinct colours for brick and wood', () => {
      expect(materialColor('brick_red')).toBe('#9f4444');
      expect(materialColor('wood_panel')).toBe('#d4a373');
    });
  });

  describe('buildWallRenderData', () => {
    it('returns null when a node is missing', () => {
      const a = createNode(0, 0);
      const b = createNode(10, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);
      expect(buildWallRenderData(wall, undefined, b, [])).toBeNull();
      expect(buildWallRenderData(wall, a, undefined, [])).toBeNull();
    });

    it('builds a single solid box for a wall with no openings', () => {
      const a = createNode(0, 0);
      const b = createNode(10, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);

      const data = buildWallRenderData(wall, a, b, []);
      expect(data).not.toBeNull();
      if (!data) return;

      // Midpoint mapped to world: x -> X, -y -> Z, group at ground (Y = 0).
      expect(data.midpoint).toEqual({ x: 5, y: 0, z: 0 });
      expect(data.rotationY).toBeCloseTo(0);
      expect(data.length).toBeCloseTo(10);
      expect(data.parts).toHaveLength(1);

      const [part] = data.parts;
      expect(part.kind).toBe('solid');
      expect(part.size).toEqual([10, 2.4, 0.2]);
      // Centered within the group, half height off the floor.
      expect(part.position[0]).toBeCloseTo(0);
      expect(part.position[1]).toBeCloseTo(1.2);
      expect(part.position[2]).toBeCloseTo(0);
      expect(part.color).toBe('#e5e7eb');
      expect(part.transparent).toBe(false);
    });

    it('computes length and midpoint for a diagonal wall using plan distance', () => {
      const a = createNode(0, 0);
      const b = createNode(3, 4);
      const wall = createWall(a.id, b.id, 0.2, 2.4);

      const data = buildWallRenderData(wall, a, b, []);
      if (!data) throw new Error('expected data');
      expect(data.length).toBeCloseTo(5);
      expect(data.midpoint).toEqual({ x: 1.5, y: 0, z: -2 });
    });

    it('splits the wall around a door opening (solid + solid, no sill for altitude 0)', () => {
      const a = createNode(0, 0);
      const b = createNode(4, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);
      const door: Opening = {
        id: 'op-1',
        wallId: wall.id,
        distFromStart: 2,
        width: 1,
        height: 2.1,
        altitude: 0,
        type: 'door',
      };

      const data = buildWallRenderData(wall, a, b, [door]);
      if (!data) throw new Error('expected data');

      const solids = data.parts.filter((p) => p.kind === 'solid');
      const sills = data.parts.filter((p) => p.kind === 'sill');
      const lintels = data.parts.filter((p) => p.kind === 'lintel');
      const glass = data.parts.filter((p) => p.kind === 'glass');

      // Two solid segments flanking the 1m-wide door (0..1.5 and 2.5..4).
      expect(solids).toHaveLength(2);
      expect(solids[0].size[0]).toBeCloseTo(1.5);
      expect(solids[1].size[0]).toBeCloseTo(1.5);
      // No sill at floor level, but a lintel above the door and a glass placeholder.
      expect(sills).toHaveLength(0);
      expect(lintels).toHaveLength(1);
      expect(lintels[0].size).toEqual([1, 2.4 - 2.1, 0.2]);
      expect(glass).toHaveLength(1);
      expect(glass[0].transparent).toBe(true);
    });

    it('produces a sill for a window with a positive altitude', () => {
      const a = createNode(0, 0);
      const b = createNode(4, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);
      const window: Opening = {
        id: 'op-2',
        wallId: wall.id,
        distFromStart: 2,
        width: 1,
        height: 1,
        altitude: 0.9,
        type: 'window',
      };

      const data = buildWallRenderData(wall, a, b, [window]);
      if (!data) throw new Error('expected data');

      const sills = data.parts.filter((p) => p.kind === 'sill');
      expect(sills).toHaveLength(1);
      expect(sills[0].size).toEqual([1, 0.9, 0.2]);
    });

    it('skips openings that extend past either end of the wall', () => {
      const a = createNode(0, 0);
      const b = createNode(4, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);
      const base = { wallId: wall.id, width: 1, height: 2.1, altitude: 0, type: 'door' as const };
      const pastStart: Opening = { ...base, id: 'op-start', distFromStart: 0.2 };
      const pastEnd: Opening = { ...base, id: 'op-end', distFromStart: 3.8 };

      const data = buildWallRenderData(wall, a, b, [pastStart, pastEnd]);
      if (!data) throw new Error('expected data');

      // Both openings ignored: the wall renders as one full-length solid box.
      expect(data.parts).toHaveLength(1);
      expect(data.parts[0].kind).toBe('solid');
      expect(data.parts[0].size[0]).toBeCloseTo(4);
      data.parts.forEach(p => expect(p.size[0]).toBeGreaterThan(0));
    });
  });
});
