import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { BuildingModel } from './BuildingModel';
import { ErrorBoundary } from './ErrorBoundary';

// Served from public/; BASE_URL keeps it working if the app is deployed under a sub-path.
const ENVIRONMENT_MAP_URL = `${import.meta.env.BASE_URL}hdr/potsdamer_platz_1k.hdr`;

// Shown in place of the 3D pane if the canvas itself fails (e.g. no WebGL); the 2D editor keeps working.
const ViewportFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div
    role="alert"
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: '#d1d5db',
      fontSize: 14,
      textAlign: 'center',
      padding: 16,
    }}
  >
    <span>3D preview is unavailable.</span>
    <span style={{ color: '#9ca3af', fontSize: 12 }}>You can keep drawing in the 2D plan.</span>
    <button
      type="button"
      onClick={onRetry}
      style={{
        padding: '6px 12px',
        borderRadius: 4,
        border: '1px solid #4b5563',
        background: '#1f2937',
        color: '#f9fafb',
        cursor: 'pointer',
      }}
    >
      Retry
    </button>
  </div>
);

export const Viewport3D: React.FC = () => {
  // R3F creates the renderer in an un-awaited async effect, so a missing WebGL context
  // surfaces as an unhandled rejection that no error boundary can catch (and it retries
  // on every render). Check up front instead; three r182 requires WebGL2.
  const [webglAvailable, setWebglAvailable] = useState(() => WebGL.isWebGL2Available());

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#111827'
    }}>
        {/* Overlay / UI */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/50 text-white text-xs rounded backdrop-blur-sm pointer-events-none">
            3D Preview
        </div>

        {!webglAvailable ? (
          <ViewportFallback onRetry={() => setWebglAvailable(WebGL.isWebGL2Available())} />
        ) : (
        <ErrorBoundary
          fallback={reset => <ViewportFallback onRetry={reset} />}
          onError={error => console.error('3D preview failed:', error)}
        >
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
            <color attach="background" args={['#111827']} />

            <OrbitControls makeDefault />

            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 10, 10]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <Grid
                infiniteGrid
                fadeDistance={30}
                sectionColor="#4b5563"
                cellColor="#374151"
            />

            <group position={[0, -0.01, 0]}>
                 <BuildingModel />
            </group>

            {/* Bundled copy of drei's "city" preset (see public/hdr/README.md), so lighting
                works offline. Still isolated: a slow load shouldn't hide the scene and a
                failed one (e.g. a bad deploy path) should only drop reflections. */}
            <ErrorBoundary
              fallback={null}
              onError={error => console.warn('Environment map failed to load; rendering without it.', error)}
            >
              <Suspense fallback={null}>
                <Environment files={ENVIRONMENT_MAP_URL} />
              </Suspense>
            </ErrorBoundary>
        </Canvas>
        </ErrorBoundary>
        )}
    </div>
  );
};
