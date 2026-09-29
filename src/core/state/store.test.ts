import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './store';
import type { EntityId } from '../domain/types';

// Builds a closed 4x4 square on the active floor and returns its node and wall IDs.
function buildSquare(): { nodeIds: EntityId[]; wallIds: EntityId[]; floorId: EntityId } {
  const { addNode, addWall } = useEditorStore.getState();
  const floorId = useEditorStore.getState().activeFloorId;
  if (!floorId) throw new Error('No active floor');

  const nodeIds = [
    addNode(0, 0),
    addNode(4, 0),
    addNode(4, 4),
    addNode(0, 4),
  ];
  const wallIds = nodeIds.map((id, i) => addWall(id, nodeIds[(i + 1) % 4], floorId));
  return { nodeIds, wallIds, floorId };
}

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().createProject();
  });

  describe('createProject', () => {
    it('should set activeFloorId to the new ground floor', () => {
      const { project, activeFloorId } = useEditorStore.getState();
      expect(activeFloorId).not.toBeNull();
      expect(project.floors[activeFloorId as EntityId].name).toBe('Ground Floor');
    });

    it('should clear the selection', () => {
      useEditorStore.getState().select(['stale-id']);
      useEditorStore.getState().createProject();
      expect(useEditorStore.getState().selectedIds).toEqual([]);
    });
  });

  describe('addWall', () => {
    it('should detect a room when a loop closes', () => {
      const { floorId } = buildSquare();
      const { project } = useEditorStore.getState();
      expect(Object.keys(project.rooms)).toHaveLength(1);
      expect(project.floors[floorId].roomIds).toHaveLength(1);
    });
  });

  describe('removeWall', () => {
    it('should remove the room when a boundary wall is deleted', () => {
      const { wallIds, floorId } = buildSquare();
      useEditorStore.getState().removeWall(wallIds[0]);

      const { project } = useEditorStore.getState();
      expect(project.walls[wallIds[0]]).toBeUndefined();
      expect(project.floors[floorId].wallIds).not.toContain(wallIds[0]);
      expect(Object.keys(project.rooms)).toHaveLength(0);
      expect(project.floors[floorId].roomIds).toHaveLength(0);
    });

    it('should delete openings on the removed wall only', () => {
      const { wallIds } = buildSquare();
      const { addOpening } = useEditorStore.getState();
      const base = { distFromStart: 2, width: 0.9, height: 2.1, altitude: 0, type: 'door' as const };
      addOpening({ ...base, id: 'op-on-removed', wallId: wallIds[0] });
      addOpening({ ...base, id: 'op-on-kept', wallId: wallIds[1] });

      useEditorStore.getState().removeWall(wallIds[0]);

      const { openings } = useEditorStore.getState().project;
      expect(openings['op-on-removed']).toBeUndefined();
      expect(openings['op-on-kept']).toBeDefined();
    });
  });

  describe('removeNode', () => {
    it('should remove every wall attached to the node', () => {
      const { nodeIds, wallIds, floorId } = buildSquare();
      // Node 0 is shared by wall 0 (0→1) and wall 3 (3→0)
      useEditorStore.getState().removeNode(nodeIds[0]);

      const { project } = useEditorStore.getState();
      expect(project.nodes[nodeIds[0]]).toBeUndefined();
      expect(project.walls[wallIds[0]]).toBeUndefined();
      expect(project.walls[wallIds[3]]).toBeUndefined();
      expect(project.walls[wallIds[1]]).toBeDefined();
      expect(project.walls[wallIds[2]]).toBeDefined();
      expect(project.floors[floorId].wallIds).toEqual([wallIds[1], wallIds[2]]);
    });

    it('should delete openings on cascaded walls and clear rooms', () => {
      const { nodeIds, wallIds } = buildSquare();
      useEditorStore.getState().addOpening({
        id: 'op', wallId: wallIds[3], distFromStart: 2, width: 0.9, height: 2.1, altitude: 0, type: 'door',
      });

      useEditorStore.getState().removeNode(nodeIds[0]);

      const { project } = useEditorStore.getState();
      expect(project.openings.op).toBeUndefined();
      expect(Object.keys(project.rooms)).toHaveLength(0);
    });

    it('should leave no wall referencing a missing node', () => {
      const { nodeIds } = buildSquare();
      useEditorStore.getState().removeNode(nodeIds[2]);

      const { project } = useEditorStore.getState();
      Object.values(project.walls).forEach(w => {
        expect(project.nodes[w.startNodeId]).toBeDefined();
        expect(project.nodes[w.endNodeId]).toBeDefined();
      });
    });
  });
});
