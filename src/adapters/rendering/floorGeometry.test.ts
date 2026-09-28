import { describe, it, expect } from 'vitest';
import { buildFloorRenderData, buildFloorShapePoints, FLOOR_ELEVATION } from './floorGeometry';
import type { Room } from '../../core/domain/types';

const room: Room = {
  id: 'room-1',
  name: 'Room 1',
  boundaryWallIds: [],
  floorId: 'floor-1',
};

describe('floorGeometry', () => {
  describe('buildFloorShapePoints', () => {
    it('keeps plan y unchanged (the -90° X rotation performs the -y -> Z flip)', () => {
      const points = buildFloorShapePoints([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
      ]);
      expect(points).toEqual([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
      ]);
    });
  });

  describe('buildFloorRenderData', () => {
    it('returns null for a degenerate polygon (< 3 vertices)', () => {
      expect(buildFloorRenderData(room, [])).toBeNull();
      expect(buildFloorRenderData(room, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeNull();
    });

    it('returns render data with the room id and mapped shape points', () => {
      const data = buildFloorRenderData(room, [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
      ]);
      expect(data).not.toBeNull();
      if (!data) return;
      expect(data.roomId).toBe('room-1');
      expect(data.shapePoints).toEqual([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
      ]);
    });
  });

  it('exposes a small positive floor elevation to avoid z-fighting with the grid', () => {
    expect(FLOOR_ELEVATION).toBeGreaterThan(0);
  });
});
