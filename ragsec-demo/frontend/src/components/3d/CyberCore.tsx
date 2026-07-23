import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron, Torus, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function CyberCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.2;
      coreRef.current.rotation.y += delta * 0.3;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.5;
      ring1Ref.current.rotation.y += delta * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= delta * 0.3;
      ring2Ref.current.rotation.y -= delta * 0.6;
    }

    // Scroll linked animations
    if (groupRef.current) {
      const scrollY = window.scrollY;
      groupRef.current.rotation.y = scrollY * 0.003;
      groupRef.current.position.y = Math.sin(scrollY * 0.002) * 1.5;
      
      // Scale down slightly as user scrolls
      const scale = Math.max(0.4, 1 - (scrollY * 0.0003));
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00d2ff" />
      <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#ff003c" />
      <pointLight position={[0, 0, 0]} intensity={2} color="#00d2ff" distance={10} />

      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        {/* Inner Glowing Core */}
        <Icosahedron ref={coreRef} args={[1.5, 0]}>
          <MeshDistortMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={2}
            wireframe
            distort={0.2}
            speed={2}
          />
        </Icosahedron>

        {/* Outer Data Rings */}
        <Torus ref={ring1Ref} args={[2.5, 0.05, 16, 100]}>
          <meshStandardMaterial color="#fadf00" emissive="#fadf00" emissiveIntensity={1} wireframe />
        </Torus>

        <Torus ref={ring2Ref} args={[3.2, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#ff003c" emissive="#ff003c" emissiveIntensity={1} wireframe />
        </Torus>
      </Float>
    </group>
  );
}
