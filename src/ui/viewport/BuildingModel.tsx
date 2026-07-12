import React, { useEffect, useMemo } from 'react';
import { useEditorStore } from '../../core/state/store';
import { buildSceneGroup, disposeGroup } from '../../adapters/rendering';

/**
 * Hosts the framework-agnostic rendering adapter inside React Three Fiber.
 *
 * All geometry-to-mesh conversion lives in `src/adapters/rendering`; this
 * component simply subscribes to the editor store and mounts the resulting
 * Three.js group as the live 3D preview.
 */
export const BuildingModel: React.FC = () => {
  const project = useEditorStore((state) => state.project);
  const group = useMemo(() => buildSceneGroup(project), [project]);

  useEffect(() => {
    return () => disposeGroup(group);
  }, [group]);

  return <primitive object={group} />;
};
