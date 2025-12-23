import { describe, it, expect } from 'vitest';
import { buildGraph } from './RoomFinder';
import { createWall, createNode } from '../domain/DomainFactory';
import { Wall, Node, EntityId } from '../domain/types';

describe('RoomFinder', () => {
  describe('buildGraph', () => {
    it('should build a directed adjacency list', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const w1 = createWall(n1.id, n2.id);

      const nodes: Record<EntityId, Node> = { [n1.id]: n1, [n2.id]: n2 };
      const walls: Record<EntityId, Wall> = { [w1.id]: w1 };

      const graph = buildGraph(nodes, walls);

      expect(graph[n1.id]).toHaveLength(1);
      expect(graph[n1.id][0].endNodeId).toBe(n2.id);
      expect(graph[n2.id]).toHaveLength(1);
      expect(graph[n2.id][0].endNodeId).toBe(n1.id);
    });
  });
});
