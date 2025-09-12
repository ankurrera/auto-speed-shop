import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Component to load and display the GLB model
function CarModel() {
  const { scene } = useGLTF('/models/car-model.glb');
  const modelRef = useRef<THREE.Group>(null);

  // Add subtle rotation animation
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={[1.5, 1.5, 1.5]} position={[0, -0.5, 0]} />
    </group>
  );
}

// Main 3D model component
export default function Car3DModel() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    // Set loading to false after a delay to show the component is working
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => {
      window.removeEventListener('error', handleError);
      clearTimeout(timer);
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white border border-white/20 rounded-lg">
        <div className="text-center">
          <p>🏎️ 3D Car Model</p>
          <p className="text-sm mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border border-white/10 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-white bg-black/20">
          <div className="text-center">
            <p>🏎️ Loading 3D Model...</p>
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: [3, 2, 3], fov: 60 }}
        className="w-full h-full"
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
        onError={() => setHasError(true)}
        onCreated={() => setIsLoading(false)}
      >
        <Suspense fallback={null}>
          {/* Lighting setup - more robust */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, 2, -5]} intensity={0.4} />
          <spotLight position={[0, 10, 0]} intensity={0.3} />
          
          {/* Car model */}
          <CarModel />
          
          {/* Controls for interaction */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={6}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model for better performance
useGLTF.preload('/models/car-model.glb');