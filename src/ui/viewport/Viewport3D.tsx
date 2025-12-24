import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { BuildingModel } from './BuildingModel';

export const Viewport3D: React.FC = () => {
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
            
            <Environment preset="city" />
        </Canvas>
    </div>
  );
};
