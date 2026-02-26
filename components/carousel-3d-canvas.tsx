'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Box } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleSystem, AnimatedLighting } from './particle-system'
import Link from 'next/link'

function TheatreCarouselGroup({ movies }: { movies: any[] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  const total = Math.min(movies.length, 8)

  return (
    <group ref={groupRef}>
      {/* Stage */}
      <Box args={[5, 0.5, 5]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Movies in carousel */}
      {movies.slice(0, total).map((movie, i) => {
        const angle = (i / total) * Math.PI * 2
        const radius = 8
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        return (
          <group key={i} position={[x, 0, z]}>
            <Box args={[1.5, 2.5, 0.1]}>
              <meshStandardMaterial
                color={['#FF6B9D', '#00D9FF', '#FF1493', '#00FF00', '#FFD700', '#00CED1'][i % 6]}
                emissive="#444444"
                emissiveIntensity={0.3}
              />
            </Box>
          </group>
        )
      })}

      {/* Center spotlight */}
      <Box args={[0.5, 0.5, 0.5]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
      </Box>

      {/* Particles */}
      <ParticleSystem count={500} useTheme={true} />

      {/* Lighting */}
      <AnimatedLighting />
    </group>
  )
}

export function Carousel3DCanvas({ movies }: { movies: any[] }) {
  return (
    <div className="relative w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 15]} fov={75} />
        <TheatreCarouselGroup movies={movies} />
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 5, 50]} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
        {/* Top Banner */}
        <div className="text-center pt-4 pointer-events-auto">
          <h2 className="text-4xl font-bold text-cyan-400 mb-2">Cinema Experience</h2>
          <p className="text-gray-400">Select a movie to explore</p>
        </div>

        {/* Bottom Info */}
        <div className="text-center pb-4 pointer-events-auto">
          {movies.length > 0 && (
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-cyan-500/50">
              <h3 className="text-2xl font-bold text-white mb-2">{movies[0]?.title || 'Movie'}</h3>
              <p className="text-gray-300 mb-4 max-w-md">{movies[0]?.description || ''}</p>
              <Link
                href={`/movies/${movies[0]?.id}`}
                className="inline-block px-6 py-2 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-600 transition"
              >
                View Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
