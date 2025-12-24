import { describe, it, expect } from 'vitest';
import { snapPointToNodes } from './LineUtils';
import { createNode } from '../domain/DomainFactory';
import type { Node } from '../domain/types';

describe('LineUtils', () => {
  describe('snapPointToNodes', () => {
    it('should return the original point if no nodes are within tolerance', () => {
      const point = { x: 10, y: 10 };
      const nodes: Node[] = [
        createNode(0, 0),
        createNode(20, 20)
      ];
      const tolerance = 0.5;

      const snapped = snapPointToNodes(point, nodes, tolerance);
      expect(snapped).toEqual(point);
    });

    it('should snap to the closest node within tolerance', () => {
      const point = { x: 10.1, y: 10.1 };
      const targetNode = createNode(10, 10);
      const otherNode = createNode(10.4, 10.4); // Also within tolerance, but further
      const nodes: Node[] = [targetNode, otherNode];
      const tolerance = 0.5;

      const snapped = snapPointToNodes(point, nodes, tolerance);
      
      expect(snapped.x).toBe(targetNode.x);
      expect(snapped.y).toBe(targetNode.y);
    });

    it('should respect the tolerance threshold', () => {
      const point = { x: 10, y: 10 };
      const node = createNode(10.6, 10);
      const tolerance = 0.5;

      const snapped = snapPointToNodes(point, [node], tolerance);
      expect(snapped).toEqual(point);
    });
  });
});
