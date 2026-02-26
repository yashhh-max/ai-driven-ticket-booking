'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Movie } from '@/lib/types'

interface MoviePostersProps {
  movies: Movie[]
  onSelect?: (movieId: string) => void
}

export default function MoviePosters({ movies, onSelect }: MoviePostersProps) {
  const groupRef = useRef<THREE.Group>(null)
  const postersRef = useRef<THREE.Mesh[]>([])

  useFrame(() => {
    if (groupRef.current) {
      postersRef.current.forEach((poster, index) => {
        if (poster) {
          poster.rotation.y += 0.005
          poster.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5 + 2
        }
      })
    }
  })

  const movieSlots = movies.length > 0 ? movies.slice(0, 6) : Array(6).fill(null)
  const spacing = 10
  const startX = -(spacing * 2.5)

  return (
    <group ref={groupRef}>
      {movieSlots.map((movie, index) => {
        const xPos = startX + index * spacing
        return (
          <group key={movie?.id || index} position={[xPos, 0, 2]}>
            {/* Movie Poster Frame */}
            <mesh
              ref={(el) => {
                if (el) postersRef.current[index] = el
              }}
              onClick={() => movie?.id && onSelect?.(movie.id)}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[3, 4.5, 0.2]} />
              <meshStandardMaterial
                color={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                metalness={0.6}
                roughness={0.4}
                emissive={`hsl(${(index * 60) % 360}, 70%, 30%)`}
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Glow Effect */}
            <pointLight
              position={[0, 0, 1]}
              intensity={0.8}
              distance={8}
              color={`hsl(${(index * 60) % 360}, 70%, 50%)`}
            />

            {/* Title Text */}
            <group position={[0, -2.5, 0.15]}>
              <mesh>
                <planeGeometry args={[2.8, 0.4]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.5} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}
