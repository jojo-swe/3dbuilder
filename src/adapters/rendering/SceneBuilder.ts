import * as THREE from 'three';
import type { Project } from '../../core/domain/types';
import { RoomUtils } from '../../core/domain/RoomUtils';
import { useEditorStore } from '../../core/state/store';
import { buildWallRenderData, type WallRenderData } from './wallGeometry';
import {
  buildFloorRenderData,
  FLOOR_COLOR,
  FLOOR_ELEVATION,
  FLOOR_ROTATION_X,
  type FloorRenderData,
} from './floorGeometry';

/**
 * Rendering adapter: turns the core domain model into a live Three.js scene.
 *
 * Framework-agnostic — this module imports Three.js and the (framework-neutral)
 * Zustand store, but never React. The UI layer only hosts the canvas and mounts
 * the group produced here.
 */

/** Instantiates a wall group (positioned + rotated) with one mesh per box part. */
export function buildWallMesh(data: WallRenderData): THREE.Group {
  const group = new THREE.Group();
  group.name = `wall:${data.wallId}`;
  group.position.set(data.midpoint.x, data.midpoint.y, data.midpoint.z);
  group.rotation.y = data.rotationY;

  for (const part of data.parts) {
    const geometry = new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
    const material = new THREE.MeshStandardMaterial({
      color: part.color,
      roughness: 0.5,
      transparent: part.transparent,
      opacity: part.opacity,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(part.position[0], part.position[1], part.position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = part.kind;
    group.add(mesh);
  }

  return group;
}

/** Instantiates a flat floor mesh laid on the ground plane. */
export function buildFloorMesh(data: FloorRenderData): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(data.shapePoints[0].x, data.shapePoints[0].y);
  for (let i = 1; i < data.shapePoints.length; i++) {
    shape.lineTo(data.shapePoints[i].x, data.shapePoints[i].y);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = FLOOR_ROTATION_X;
  mesh.position.set(0, FLOOR_ELEVATION, 0);
  mesh.receiveShadow = true;
  mesh.name = `floor:${data.roomId}`;
  return mesh;
}

/** Builds the full building scene group (walls + floors) for a project snapshot. */
export function buildSceneGroup(project: Project): THREE.Group {
  const root = new THREE.Group();
  root.name = 'building';

  for (const wall of Object.values(project.walls)) {
    const openings = Object.values(project.openings).filter((op) => op.wallId === wall.id);
    const data = buildWallRenderData(
      wall,
      project.nodes[wall.startNodeId],
      project.nodes[wall.endNodeId],
      openings,
    );
    if (data) root.add(buildWallMesh(data));
  }

  for (const room of Object.values(project.rooms)) {
    const polygon = RoomUtils.getPolygon(project, room);
    const data = buildFloorRenderData(room, polygon);
    if (data) root.add(buildFloorMesh(data));
  }

  return root;
}

/** Releases GPU resources for every mesh below the given object. */
export function disposeGroup(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material.dispose();
      }
    }
  });
}

/**
 * Mounts a live building scene under `parent` and keeps it in sync with the
 * editor store. Returns a disposer that unsubscribes and frees resources.
 */
export function mountBuildingScene(parent: THREE.Object3D): () => void {
  let current = buildSceneGroup(useEditorStore.getState().project);
  parent.add(current);

  const unsubscribe = useEditorStore.subscribe((state) => {
    parent.remove(current);
    disposeGroup(current);
    current = buildSceneGroup(state.project);
    parent.add(current);
  });

  return () => {
    unsubscribe();
    parent.remove(current);
    disposeGroup(current);
  };
}
