'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Box, Torus } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleSystem, AnimatedLighting } from './particle-system'

interface Movie3DCarouselProps {
  movies: any[]
  selectedIndex: number
  onSelectMovie: (index: number) => void
}

function MovieCarouselItem({ movie, index, total, selectedIndex }: any) {
  const meshRef = useRef<THREE.Group>(null)
  const angle = (index / total) * Math.PI * 2

  useFrame(() => {
    if (!meshRef.current) return

    // Circular carousel motion
    const radius = 8
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    meshRef.current.position.x = x
    meshRef.current.position.z = z
    meshRef.current.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5

    // Look at center
    meshRef.current.lookAt(0, 0, 0)

    // Scale based on selection
    const scale = index === selectedIndex ? 1.3 : 0.8
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
  })

  const getColor = () => {
    const colors = ['#FF6B9D', '#00D9FF', '#FF1493', '#00FF00', '#FFD700']
    return colors[index % colors.length]
  }

  return (
    <group ref={meshRef} onClick={() => {}}>
      {/* Movie card */}
      <Box args={[1.5, 2, 0.1]}>
        <meshStandardMaterial
          color={getColor()}
          metalness={0.7}
          roughness={0.2}
          emissive={getColor()}
          emissiveIntensity={index === selectedIndex ? 0.5 : 0.2}
        />
      </Box>

      {/* Frame around movie */}
      <Torus args={[1, 0.1, 16, 32]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </Torus>

      {/* Title indicator */}
      <group position={[0, -1.3, 0.1]}>
        <Box args={[1.4, 0.2, 0.05]}>
          <meshStandardMaterial color="#000000" />
        </Box>
      </group>
    </group>
  )
}

export function Theater3DHomePage({ movies }: { movies: any[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const selectedIndexRef = useRef(0)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central stage */}
      <Box args={[5, 0.5, 5]} position={[0, -2, 0]}>
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
        />
      </Box>

      {/* Movie carousel */}
      {movies.slice(0, 8).map((movie, i) => (
        <MovieCarouselItem
          key={movie.id}
          movie={movie}
          index={i}
          total={8}
          selectedIndex={selectedIndexRef.current}
        />
      ))}

      {/* Center spotlight */}
      <Box args={[0.5, 0.5, 0.5]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
        />
      </Box>

      {/* Particle system */}
      <ParticleSystem count={500} color="#00D9FF" />

      {/* Lighting */}
      <AnimatedLighting />
    </group>
  )
}

interface TheatreHomePageProps {
  movies: any[]
  onMovieSelect: (movie: any) => void
}

export function TheatreHomePage3D({ movies, onMovieSelect }: TheatreHomePageProps) {
  const selectedIndexRef = useRef(0)

  const handleSelect = (index: number) => {
    selectedIndexRef.current = index
    onMovieSelect(movies[index])
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 15]} fov={60} />
        <Theater3DHomePage movies={movies} />
        <color attach="background" args={['#0a0a0a']} />
      </Canvas>

      {/* Movie info overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top banner */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600">
            3D Theater Experience
          </h1>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent p-8 flex items-end justify-between">
          <div className="text-white">
            <p className="text-sm text-gray-400 mb-2">Rotate to browse • Click to select</p>
            <p className="text-xs text-gray-500">
              {movies.length} Movies Available • Use mouse to navigate
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-cyan-400 font-semibold">
              Featuring {movies.length} blockbuster films
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
