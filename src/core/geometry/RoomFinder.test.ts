import { describe, it, expect } from 'vitest';
import { RoomFinder, buildGraph } from './RoomFinder';
import { createWall, createNode } from '../domain/DomainFactory';
import type { Wall, Node, EntityId } from '../domain/types';

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

  describe('findRooms', () => {
    it('should find a simple rectangular room', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(10, 10);
      const n4 = createNode(0, 10);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n4.id, n1.id);

      const nodes: Record<EntityId, Node> = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4 };
      const walls: Record<EntityId, Wall> = { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4 };

      const loops = RoomFinder.findRooms(nodes, walls);

      expect(loops).toHaveLength(1);
      const loop = loops[0];
      expect(loop).toHaveLength(4);
      expect(loop).toContain(w1.id);
      expect(loop).toContain(w2.id);
      expect(loop).toContain(w3.id);
      expect(loop).toContain(w4.id);
    });

    it('should find two rooms sharing a wall', () => {
      // 0,0 -> 10,0 -> 20,0
      // |      |       |
      // 0,10-> 10,10-> 20,10
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(20, 0);
      const n4 = createNode(20, 10);
      const n5 = createNode(10, 10);
      const n6 = createNode(0, 10);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n4.id, n5.id);
      const w5 = createWall(n5.id, n2.id); // Shared wall (vertical)
      const w6 = createWall(n5.id, n6.id);
      const w7 = createWall(n6.id, n1.id);

      const nodes: Record<EntityId, Node> = {
        [n1.id]: n1, [n2.id]: n2, [n3.id]: n3,
        [n4.id]: n4, [n5.id]: n5, [n6.id]: n6
      };
      const walls: Record<EntityId, Wall> = {
        [w1.id]: w1, [w2.id]: w2, [w3.id]: w3,
        [w4.id]: w4, [w5.id]: w5, [w6.id]: w6, [w7.id]: w7
      };

      const loops = RoomFinder.findRooms(nodes, walls);
      expect(loops).toHaveLength(2);
    });

    it('should return empty for open shapes (no closed loop)', () => {
      // L-shape that doesn't close
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(10, 10);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);

      const nodes: Record<EntityId, Node> = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3 };
      const walls: Record<EntityId, Wall> = { [w1.id]: w1, [w2.id]: w2 };

      const loops = RoomFinder.findRooms(nodes, walls);
      expect(loops).toHaveLength(0);
    });

    it('should handle dead end (single connection node)', () => {
      // Square with an extra wall sticking out (dead end)
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(10, 10);
      const n4 = createNode(0, 10);
      const n5 = createNode(15, 0); // Dead end node

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n4.id);
      const w4 = createWall(n4.id, n1.id);
      const w5 = createWall(n2.id, n5.id); // Dead end wall

      const nodes: Record<EntityId, Node> = {
        [n1.id]: n1, [n2.id]: n2, [n3.id]: n3, [n4.id]: n4, [n5.id]: n5
      };
      const walls: Record<EntityId, Wall> = {
        [w1.id]: w1, [w2.id]: w2, [w3.id]: w3, [w4.id]: w4, [w5.id]: w5
      };

      const loops = RoomFinder.findRooms(nodes, walls);
      // Should still find the square room, ignoring the dead end
      expect(loops).toHaveLength(1);
      expect(loops[0]).toHaveLength(4);
    });

    it('should handle triangular room', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);
      const n3 = createNode(5, 8);

      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, n3.id);
      const w3 = createWall(n3.id, n1.id);

      const nodes: Record<EntityId, Node> = { [n1.id]: n1, [n2.id]: n2, [n3.id]: n3 };
      const walls: Record<EntityId, Wall> = { [w1.id]: w1, [w2.id]: w2, [w3.id]: w3 };

      const loops = RoomFinder.findRooms(nodes, walls);
      expect(loops).toHaveLength(1);
      expect(loops[0]).toHaveLength(3);
    });

    it('should skip walls with missing nodes', () => {
      const n1 = createNode(0, 0);
      const n2 = createNode(10, 0);

      // Create wall referencing a non-existent node
      const w1 = createWall(n1.id, n2.id);
      const w2 = createWall(n2.id, 'nonexistent-node');

      const nodes: Record<EntityId, Node> = { [n1.id]: n1, [n2.id]: n2 };
      const walls: Record<EntityId, Wall> = { [w1.id]: w1, [w2.id]: w2 };

      // Should not throw, just skip the invalid wall
      const loops = RoomFinder.findRooms(nodes, walls);
      expect(loops).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const loops = RoomFinder.findRooms({}, {});
      expect(loops).toHaveLength(0);
    });
  });
});
