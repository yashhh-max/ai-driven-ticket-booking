'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useThemeColors } from './theme-provider-3d'

interface ParticleSystemProps {
  count?: number
  color?: string
  useTheme?: boolean
}

export function ParticleSystem({ count = 1000, color, useTheme = true }: ParticleSystemProps) {
  const themeColors = useTheme ? useThemeColors() : null
  const particleColor = color || themeColors?.particleColor || '#00D9FF'
  const meshRef = useRef<THREE.Points>(null)
  const positionArray = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 20
      positions[i + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [count])

  const velocityArray = useMemo(() => {
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      velocities[i] = (Math.random() - 0.5) * 0.02
      velocities[i + 1] = (Math.random() - 0.5) * 0.02
      velocities[i + 2] = (Math.random() - 0.5) * 0.02
    }
    return velocities
  }, [count])

  useFrame(() => {
    if (!meshRef.current) return

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] += velocityArray[i]
      positions[i + 1] += velocityArray[i + 1]
      positions[i + 2] += velocityArray[i + 2]

      // Wrap around
      if (positions[i] > 10) positions[i] = -10
      if (positions[i + 1] > 10) positions[i + 1] = -10
      if (positions[i + 2] > 10) positions[i + 2] = -10
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true

    // Rotate
    meshRef.current.rotation.x += 0.0001
    meshRef.current.rotation.y += 0.0002
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positionArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={particleColor}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  )
}

export function AnimatedLighting() {
  const themeColors = useThemeColors()
  
  return (
    <>
      {/* Main key light */}
      <directionalLight position={[10, 10, 10]} intensity={1.2} color={themeColors.lightColor1} castShadow />
      
      {/* Fill light */}
      <directionalLight position={[-10, 5, 5]} intensity={0.6} color={themeColors.lightColor2} />
      
      {/* Back light */}
      <directionalLight position={[0, 0, -10]} intensity={0.8} color={themeColors.lightColor3} />
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} color={themeColors.primary} />
      
      {/* Point lights for glow */}
      <pointLight position={[5, 5, 5]} intensity={0.8} color={themeColors.lightColor1} distance={20} />
      <pointLight position={[-5, -5, 5]} intensity={0.6} color={themeColors.lightColor2} distance={20} />
      <pointLight position={[0, 0, 10]} intensity={0.7} color={themeColors.lightColor3} distance={25} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={[themeColors.background, 5, 50]} />
    </>
  )
}
