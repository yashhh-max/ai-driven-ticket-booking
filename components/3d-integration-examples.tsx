'use client'

// Quick integration example component
// This shows how to integrate all 3D components together

import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { ParticleSystem, AnimatedLighting } from './particle-system'
import { ThemeSwitcher, useTheme3D } from './theme-provider-3d'

/**
 * Example: Enhanced 3D Background for any page
 * Place this inside your existing pages to add a 3D particle background
 */
export function ParticleBackground({ intensity = 0.3 }) {
  const { theme } = useTheme3D()

  return (
    <div className="fixed inset-0 -z-10 opacity-50" style={{ backgroundColor: theme.colors.background }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={75} />
        <ParticleSystem count={500} useTheme={true} />
        <AnimatedLighting />
        <color attach="background" args={[theme.colors.background]} />
      </Canvas>
    </div>
  )
}

/**
 * Example: Floating 3D Card Component
 * Wrap any content in a 3D styled container
 */
export function FloatingCard3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { theme } = useTheme3D()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative p-6 rounded-lg border transition-all duration-300 ${className} ${
        isHovered
          ? 'shadow-2xl border-opacity-100 scale-105'
          : 'border-opacity-50 shadow-lg scale-100'
      }`}
      style={{
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.background}dd`,
        boxShadow: isHovered
          ? `0 0 30px ${theme.colors.primary}40, 0 0 60px ${theme.colors.secondary}20`
          : `0 0 10px ${theme.colors.primary}20`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  )
}

/**
 * Example: Neon Button with 3D effects
 */
export function NeonButton3D({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const { theme } = useTheme3D()
  const [isActive, setIsActive] = useState(false)

  return (
    <button
      className={`relative px-6 py-3 font-bold rounded transition-all duration-200 ${className}`}
      style={{
        backgroundColor: isActive ? theme.colors.primary : 'transparent',
        color: isActive ? theme.colors.background : theme.colors.primary,
        border: `2px solid ${theme.colors.primary}`,
        boxShadow: isActive
          ? `0 0 20px ${theme.colors.primary}, inset 0 0 20px ${theme.colors.primary}40`
          : `0 0 10px ${theme.colors.primary}40`,
        transform: isActive ? 'scale(0.98)' : 'scale(1)',
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onMouseLeave={() => setIsActive(false)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/**
 * Example: Animated gradient text
 */
export function AnimatedGradientText({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { theme } = useTheme3D()

  return (
    <div
      className={`text-transparent bg-clip-text bg-gradient-to-r animate-pulse ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
        backgroundSize: '200% 100%',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Integration Quick Start:
 *
 * 1. Wrap your app with Theme3DProvider:
 *    <Theme3DProvider>
 *      <YourApp />
 *    </Theme3DProvider>
 *
 * 2. Add theme switcher anywhere:
 *    <ThemeSwitcher />
 *
 * 3. Add particle background to pages:
 *    <ParticleBackground intensity={0.3} />
 *
 * 4. Style cards with 3D effects:
 *    <FloatingCard3D>
 *      <p>Your content</p>
 *    </FloatingCard3D>
 *
 * 5. Use theme-aware colors in components:
 *    const { theme } = useTheme3D()
 *    style={{ color: theme.colors.primary }}
 */
