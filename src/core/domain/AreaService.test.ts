import { describe, it, expect } from 'vitest';
import { AreaService } from './AreaService';
import { createWall, createNode } from './DomainFactory';
import type { Project } from './types';

describe('AreaService', () => {
    it('should calculate area for a simple room', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(10, 10);
      const n4 = createNode(0, 10);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n4.id, n1.id);

      const project: Project = {
          id: 'p1', name: 'Test',
          nodes: { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4 },
          walls: { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4 },
          rooms: {}, openings: {}, floors: {}, version: '1'
      };

      const result = AreaService.calculateAreas(project);

      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].area).toBeCloseTo(100);
      expect(result.rooms[0].perimeter).toBeCloseTo(40);
    });

    it('should calculate area with walls defined in mixed directions', () => {
      // Create a square room where some walls have reversed node order
      // This tests the else-if branch where startNodeId connects to next wall
      const n1 = createNode(0, 0);
      const n2 = createNode(5, 0);
      const n3 = createNode(5, 5);
      const n4 = createNode(0, 5);

      // Define walls with some reversed directions
      // w1: n1 -> n2 (normal)
      // w2: n3 -> n2 (reversed - startNode n3 connects to w1's endNode n2)
      // w3: n3 -> n4 (normal - startNode n3 connects to w2's startNode n3)
      // w4: n1 -> n4 (reversed - endNode n4 connects to w3's endNode n4)
      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n3.id, n2.id); // reversed
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n1.id, n4.id); // reversed

      const project: Project = {
          id: 'p1', name: 'Test',
          nodes: { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4 },
          walls: { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4 },
          rooms: {}, openings: {}, floors: {}, version: '1'
      };

      const result = AreaService.calculateAreas(project);

      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].area).toBeCloseTo(25); // 5x5 = 25
      expect(result.rooms[0].perimeter).toBeCloseTo(20); // 4*5 = 20
    });

    it('should return empty when no rooms exist', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const w1 = createWall(n1.id, n2.id); // Single wall, no room

      const project: Project = {
          id: 'p1', name: 'Test',
          nodes: { [n1.id]: n1, [n2.id]: n2 },
          walls: { [w1.id]: w1 },
          rooms: {}, openings: {}, floors: {}, version: '1'
      };

      const result = AreaService.calculateAreas(project);

      expect(result.rooms).toHaveLength(0);
      expect(result.totalArea).toBe(0);
    });

    it('should calculate total area for multiple rooms', () => {
      // Two adjacent rooms sharing a wall
      const n1 = createNode(0, 0);
      const n2 = createNode(4, 0);
      const n3 = createNode(8, 0);
      const n4 = createNode(8, 3);
      const n5 = createNode(4, 3);
      const n6 = createNode(0, 3);

      const w1 = createWall(n1.id, n2.id); // bottom-left
      const w2 = createWall(n2.id, n3.id); // bottom-right
      const w3 = createWall(n3.id, n4.id); // right
      const w4 = createWall(n4.id, n5.id); // top-right
      const w5 = createWall(n5.id, n2.id); // shared vertical
      const w6 = createWall(n5.id, n6.id); // top-left
      const w7 = createWall(n6.id, n1.id); // left

      const project: Project = {
          id: 'p1', name: 'Test',
          nodes: {
            [n1.id]: n1, [n2.id]: n2, [n3.id]: n3,
            [n4.id]: n4, [n5.id]: n5, [n6.id]: n6
          },
          walls: {
            [w1.id]: w1, [w2.id]: w2, [w3.id]: w3,
            [w4.id]: w4, [w5.id]: w5, [w6.id]: w6, [w7.id]: w7
          },
          rooms: {}, openings: {}, floors: {}, version: '1'
      };

      const result = AreaService.calculateAreas(project);

      expect(result.rooms).toHaveLength(2);
      // Room 1: 4x3 = 12, Room 2: 4x3 = 12
      expect(result.totalArea).toBeCloseTo(24);
    });
});
