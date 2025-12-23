import { describe, it, expect } from 'vitest';
import { AreaService } from './AreaService';
import { createWall, createNode } from './DomainFactory';
import { Project, Node, Wall, EntityId } from './types';

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
});
