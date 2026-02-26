'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei'
import { Movie } from '@/lib/types'
import CinemaRoom from './3d-models/cinema-room'
import MoviePosters from './3d-models/movie-posters'
import LightingSetup from './3d-models/lighting-setup'

interface Cinema3DSceneProps {
  movies?: Movie[]
  onMovieSelect?: (movieId: string) => void
  interactive?: boolean
}

export function Cinema3DScene({
  movies = [],
  onMovieSelect,
  interactive = true,
}: Cinema3DSceneProps) {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        <Suspense fallback={null}>
          {/* Lighting */}
          <LightingSetup />

          {/* Environment */}
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />

          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={[0, 2, 8]}
            fov={75}
            near={0.1}
            far={1000}
          />

          {/* 3D Cinema Room */}
          <CinemaRoom />

          {/* Movie Posters */}
          <MoviePosters movies={movies} onSelect={onMovieSelect} />

          {/* Controls */}
          {interactive && (
            <OrbitControls
              enableZoom
              enablePan
              enableRotate
              autoRotate
              autoRotateSpeed={2}
              minDistance={5}
              maxDistance={50}
            />
          )}
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 text-white">
          <h1 className="text-4xl font-bold mb-2">AuroSeat</h1>
          <p className="text-gray-300">Immersive Cinema Experience</p>
        </div>
      </div>
    </div>
  )
}
