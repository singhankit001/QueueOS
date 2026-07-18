'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-ignore
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

function StarField() {
  const ref = useRef<THREE.Points>(null);
  
  // Generate a spherical distribution of points for the starfield
  const positions = useMemo(() => {
    const p = new Float32Array(3000);
    random.inSphere(p, { radius: 15 });
    return p;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      // Slow rotation for ambient feel
      ref.current.rotation.x -= delta / 30;
      ref.current.rotation.y -= delta / 40;
      
      // Mouse parallax effect
      const targetX = (state.pointer.x * Math.PI) / 10;
      const targetY = (state.pointer.y * Math.PI) / 10;
      
      ref.current.rotation.y += 0.02 * (targetX - ref.current.rotation.y);
      ref.current.rotation.x += 0.02 * (targetY - ref.current.rotation.x);
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#0070F3"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export function BackgroundScene() {
  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      {/* Deep luxury gradient underlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
      
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <fog attach="fog" args={['#000000', 5, 20]} />
        <StarField />
      </Canvas>
    </div>
  );
}
