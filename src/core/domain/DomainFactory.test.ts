import { describe, it, expect } from 'vitest';
import { createWall, createNode } from './DomainFactory';

describe('DomainFactory', () => {
  describe('createNode', () => {
    it('should create a node with valid coordinates', () => {
      const node = createNode(10, 20);
      expect(node.x).toBe(10);
      expect(node.y).toBe(20);
      expect(node.id).toBeDefined();
    });
  });

  describe('createWall', () => {
    it('should create a wall with valid parameters', () => {
      const startNode = createNode(0, 0);
      const endNode = createNode(10, 0);
      const wall = createWall(startNode.id, endNode.id, 0.2, 2.5);

      expect(wall.startNodeId).toBe(startNode.id);
      expect(wall.endNodeId).toBe(endNode.id);
      expect(wall.thickness).toBe(0.2);
      expect(wall.height).toBe(2.5);
      expect(wall.id).toBeDefined();
    });

    it('should throw error if thickness is non-positive', () => {
      const startNode = createNode(0, 0);
      const endNode = createNode(10, 0);
      expect(() => createWall(startNode.id, endNode.id, 0, 2.5)).toThrow();
      expect(() => createWall(startNode.id, endNode.id, -1, 2.5)).toThrow();
    });

    it('should throw error if height is non-positive', () => {
      const startNode = createNode(0, 0);
      const endNode = createNode(10, 0);
      expect(() => createWall(startNode.id, endNode.id, 0.2, 0)).toThrow();
    });

    it('should throw error if start and end nodes are the same', () => {
      const startNode = createNode(0, 0);
      expect(() => createWall(startNode.id, startNode.id, 0.2, 2.5)).toThrow();
    });
  });
});
