import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  buildWallMesh,
  buildFloorMesh,
  buildSceneGroup,
  mountBuildingScene,
} from './SceneBuilder';
import { buildWallRenderData } from './wallGeometry';
import { buildFloorRenderData } from './floorGeometry';
import { createNode, createWall } from '../../core/domain/DomainFactory';
import { useEditorStore } from '../../core/state/store';
import type { Project, Room } from '../../core/domain/types';

function makeRectProject(): { project: Project; floorId: string } {
  useEditorStore.getState().createProject();
  const store = useEditorStore.getState();
  const floorId = Object.keys(store.project.floors)[0];
  const n1 = store.addNode(0, 0);
  const n2 = store.addNode(4, 0);
  const n3 = store.addNode(4, 3);
  const n4 = store.addNode(0, 3);
  store.addWall(n1, n2, floorId);
  store.addWall(n2, n3, floorId);
  store.addWall(n3, n4, floorId);
  store.addWall(n4, n1, floorId);
  return { project: useEditorStore.getState().project, floorId };
}

describe('SceneBuilder', () => {
  describe('buildWallMesh', () => {
    it('creates a group positioned and rotated to the wall centerline', () => {
      const a = createNode(0, 0);
      const b = createNode(10, 0);
      const wall = createWall(a.id, b.id, 0.2, 2.4);
      const data = buildWallRenderData(wall, a, b, []);
      if (!data) throw new Error('expected data');

      const group = buildWallMesh(data);
      expect(group).toBeInstanceOf(THREE.Group);
      expect(group.position.x).toBeCloseTo(5);
      expect(group.position.z).toBeCloseTo(0);
      expect(group.rotation.y).toBeCloseTo(0);
      expect(group.children).toHaveLength(1);
      expect(group.children[0]).toBeInstanceOf(THREE.Mesh);
    });
  });

  describe('buildFloorMesh', () => {
    it('creates a flat mesh laid on the ground plane', () => {
      const room: Room = { id: 'r1', name: 'r', boundaryWallIds: [], floorId: 'f1' };
      const data = buildFloorRenderData(room, [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
      ]);
      if (!data) throw new Error('expected data');

      const mesh = buildFloorMesh(data);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.rotation.x).toBeCloseTo(-Math.PI / 2);
      expect(mesh.position.y).toBeGreaterThan(0);
      expect(mesh.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    });
  });

  describe('buildSceneGroup', () => {
    it('produces one wall group per wall and one floor mesh per room', () => {
      const { project } = makeRectProject();
      const group = buildSceneGroup(project);

      const wallGroups = group.children.filter((c) => c.name.startsWith('wall:'));
      const floorMeshes = group.children.filter((c) => c.name.startsWith('floor:'));
      expect(wallGroups).toHaveLength(4);
      expect(floorMeshes).toHaveLength(1);
    });

    it('skips walls whose nodes are missing', () => {
      const project: Project = {
        id: 'p',
        name: 'p',
        version: '1.0.0',
        nodes: {},
        walls: {
          w1: { id: 'w1', startNodeId: 'x', endNodeId: 'y', thickness: 0.2, height: 2.4 },
        },
        rooms: {},
        openings: {},
        floors: {},
      };
      const group = buildSceneGroup(project);
      expect(group.children).toHaveLength(0);
    });
  });

  describe('mountBuildingScene', () => {
    beforeEach(() => {
      useEditorStore.getState().createProject();
    });

    it('mounts the current scene and rebuilds on store changes, then cleans up', () => {
      const parent = new THREE.Group();
      const dispose = mountBuildingScene(parent);

      // Initially a single scene root with no geometry.
      expect(parent.children).toHaveLength(1);
      const before = parent.children[0];
      expect(before.children).toHaveLength(0);

      // Mutating the store rebuilds the scene.
      const store = useEditorStore.getState();
      const floorId = Object.keys(store.project.floors)[0];
      const n1 = store.addNode(0, 0);
      const n2 = store.addNode(4, 0);
      store.addWall(n1, n2, floorId);

      expect(parent.children).toHaveLength(1);
      const after = parent.children[0];
      expect(after).not.toBe(before);
      expect(after.children.length).toBeGreaterThan(0);

      dispose();
      expect(parent.children).toHaveLength(0);
    });
  });
});
