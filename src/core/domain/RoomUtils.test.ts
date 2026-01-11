import { describe, it, expect } from 'vitest';
import { RoomUtils } from './RoomUtils';
import { createNode, createWall } from './DomainFactory';
import type { Project, Room } from './types';

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test',
    nodes: {},
    walls: {},
    rooms: {},
    openings: {},
    floors: {},
    version: '1'
  };
}

describe('RoomUtils', () => {
  describe('getPolygon', () => {
    it('should return polygon vertices for a rectangular room', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(10, 5);
      const n4 = createNode(0, 5);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n4.id, n1.id);

      const project = createTestProject();
      project.nodes = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4 };
      project.walls = { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4 };

      const room: Room = {
        id: 'room1',
        name: 'Living Room',
        boundaryWallIds: [w1.id, w2.id, w3.id, w4.id],
        floorId: 'floor1'
      };

      const polygon = RoomUtils.getPolygon(project, room);

      expect(polygon).toHaveLength(4);
      // Verify all corners are present
      const coords = polygon.map(p => `${p.x},${p.y}`);
      expect(coords).toContain('0,0');
      expect(coords).toContain('10,0');
      expect(coords).toContain('10,5');
      expect(coords).toContain('0,5');
    });

    it('should return polygon vertices for a triangular room', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(6, 0);
      const n3 = createNode(3, 4);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n1.id);

      const project = createTestProject();
      project.nodes = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3 };
      project.walls = { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3 };

      const room: Room = {
        id: 'room1',
        name: 'Triangle Room',
        boundaryWallIds: [w1.id, w2.id, w3.id],
        floorId: 'floor1'
      };

      const polygon = RoomUtils.getPolygon(project, room);

      expect(polygon).toHaveLength(3);
    });

    it('should return empty array for room with no walls', () => {
      const project = createTestProject();
      const room: Room = {
        id: 'room1',
        name: 'Empty Room',
        boundaryWallIds: [],
        floorId: 'floor1'
      };

      const polygon = RoomUtils.getPolygon(project, room);
      expect(polygon).toHaveLength(0);
    });

    it('should return empty array if walls are missing from project', () => {
      const project = createTestProject();
      const room: Room = {
        id: 'room1',
        name: 'Missing Walls Room',
        boundaryWallIds: ['nonexistent-wall-1', 'nonexistent-wall-2'],
        floorId: 'floor1'
      };

      const polygon = RoomUtils.getPolygon(project, room);
      expect(polygon).toHaveLength(0);
    });

    it('should return empty array if first two walls are disconnected', () => {
      // Two walls that don't share any node
      const n1 = createNode(0, 0);
      const n2 = createNode(5, 0);
      const n3 = createNode(10, 10);
      const n4 = createNode(15, 10);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n3.id, n4.id); // No shared node with w1

      const project = createTestProject();
      project.nodes = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4 };
      project.walls = { [w1.id]: w1, [w2.id]: w2 };

      const room: Room = {
        id: 'room1',
        name: 'Disconnected Room',
        boundaryWallIds: [w1.id, w2.id],
        floorId: 'floor1'
      };

      const polygon = RoomUtils.getPolygon(project, room);
      expect(polygon).toHaveLength(0);
    });

    it('should handle disconnected wall mid-traversal gracefully', () => {
      // First two walls connect, but third wall is disconnected
      const n1 = createNode(0, 0);
      const n2 = createNode(5, 0);
      const n3 = createNode(5, 5);
      const n4 = createNode(20, 20); // Disconnected
      const n5 = createNode(25, 20);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n4.id, n5.id); // Disconnected from n3
      const w4 = createWall(n3.id, n1.id); // Would close the loop if w3 wasn't there

      const project = createTestProject();
      project.nodes = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4, [n5.id]: n5 };
      project.walls = { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4 };

      const room: Room = {
        id: 'room1',
        name: 'Mid-Disconnected Room',
        boundaryWallIds: [w1.id, w2.id, w3.id, w4.id],
        floorId: 'floor1'
      };

      // Should not throw and returns whatever nodes it could collect
      const polygon = RoomUtils.getPolygon(project, room);
      expect(polygon).toBeDefined();
      expect(Array.isArray(polygon)).toBe(true);
    });
  });

  describe('toSvgPath', () => {
    it('should generate correct SVG path for a square', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const path = RoomUtils.toSvgPath(points);

      expect(path).toBe('M 0,0 L 10,0 L 10,10 L 0,10 Z');
    });

    it('should generate correct SVG path for a triangle', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2.5, y: 4 }
      ];

      const path = RoomUtils.toSvgPath(points);

      expect(path).toBe('M 0,0 L 5,0 L 2.5,4 Z');
    });

    it('should return empty string for empty points array', () => {
      const path = RoomUtils.toSvgPath([]);
      expect(path).toBe('');
    });

    it('should handle single point', () => {
      const points = [{ x: 5, y: 5 }];
      const path = RoomUtils.toSvgPath(points);
      expect(path).toBe('M 5,5 Z');
    });

    it('should handle decimal coordinates', () => {
      const points = [
        { x: 0.5, y: 1.25 },
        { x: 3.75, y: 2.5 }
      ];

      const path = RoomUtils.toSvgPath(points);

      expect(path).toBe('M 0.5,1.25 L 3.75,2.5 Z');
    });
  });
});
