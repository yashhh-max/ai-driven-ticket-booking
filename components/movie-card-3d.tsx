'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Box, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

function Movie3DCard({ title, genre, rating }: { title: string; genre: string; rating: string }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main card */}
      <Box args={[2, 3, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FF6B9D"
          metalness={0.7}
          roughness={0.3}
          emissive="#FF1493"
          emissiveIntensity={0.2}
        />
      </Box>

      {/* Rotating ring */}
      <Cylinder args={[2.5, 2.5, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#00D9FF"
          metalness={0.8}
          roughness={0.2}
          emissive="#00D9FF"
          emissiveIntensity={0.3}
        />
      </Cylinder>

      {/* Lights */}
      <pointLight position={[2, 2, 2]} intensity={0.8} color="#FF1493" />
      <pointLight position={[-2, -2, 2]} intensity={0.6} color="#00D9FF" />
    </group>
  )
}

export function MovieCard3D({ movie }: { movie: any }) {
  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-2xl">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <Movie3DCard
          title={movie.title}
          genre={movie.genre}
          rating={movie.rating}
        />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <color attach="background" args={['#1a1a2e']} />
      </Canvas>

      {/* Title overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black to-transparent">
        <h3 className="text-xl font-bold text-white">{movie.title}</h3>
        <p className="text-sm text-gray-300">{movie.genre}</p>
      </div>
    </div>
  )
}
