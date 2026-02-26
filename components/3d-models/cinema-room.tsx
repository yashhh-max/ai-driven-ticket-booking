'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function CinemaRoom() {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2, -15]}>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#16213e" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-15, 2, 0]}>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#0f3460" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Right Wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[15, 2, 0]}>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#0f3460" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0e27" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Center Screen Arch - Movie Screen Placeholder */}
      <mesh position={[0, 3, -14.8]} scale={[4, 3, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff006e"
          emissive="#ff006e"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Ambient Light Glow Effect */}
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#8338ec" distance={30} />
      <pointLight position={[-8, 3, 0]} intensity={1} color="#3a86ff" distance={25} />
      <pointLight position={[8, 3, 0]} intensity={1} color="#fb5607" distance={25} />
    </group>
  )
}
