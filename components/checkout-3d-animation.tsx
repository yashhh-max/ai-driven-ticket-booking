'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Box, Sphere, Torus } from '@react-three/drei'
import * as THREE from 'three'

interface Checkout3DProps {
  status: 'processing' | 'success' | 'failed'
  bookingId?: string
  totalAmount?: number
}

function ProcessingAnimation() {
  const ringRef = useRef<THREE.Mesh>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.x += 0.01
      sphereRef.current.rotation.y += 0.015
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.z += 0.005
    }
  })

  const particleCount = 100
  const positionArray = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i += 3) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 2
    positionArray[i] = Math.cos(angle) * radius
    positionArray[i + 1] = Math.sin(angle) * radius * 0.5
    positionArray[i + 2] = Math.sin(angle) * radius
  }

  return (
    <group>
      {/* Central sphere */}
      <Sphere args={[0.8, 32, 32]} ref={sphereRef}>
        <meshStandardMaterial
          color="#00D9FF"
          emissive="#00D9FF"
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.2}
        />
      </Sphere>

      {/* Rotating rings */}
      <Torus args={[1.5, 0.1, 16, 100]} ref={ringRef} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FF1493"
          emissive="#FF1493"
          emissiveIntensity={0.4}
        />
      </Torus>

      <Torus args={[2.2, 0.08, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
        <meshStandardMaterial
          color="#00FF00"
          emissive="#00FF00"
          emissiveIntensity={0.3}
        />
      </Torus>

      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positionArray}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#FFD700"
          transparent
          opacity={0.8}
        />
      </points>

      {/* Ambient lights */}
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#00D9FF" />
      <pointLight position={[-3, -3, 3]} intensity={0.8} color="#FF1493" />
    </group>
  )
}

function SuccessAnimation() {
  const checkmarkRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (checkmarkRef.current) {
      checkmarkRef.current.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.1
      checkmarkRef.current.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.1
      checkmarkRef.current.rotation.z += 0.01
    }
  })

  return (
    <group ref={checkmarkRef}>
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial
          color="#00FF00"
          emissive="#00FF00"
          emissiveIntensity={0.6}
          metalness={0.6}
          roughness={0.3}
        />
      </Sphere>

      {/* Checkmark */}
      <Box args={[0.3, 2, 0.2]} position={[-0.3, 0, 0.5]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
      </Box>
      <Box args={[0.3, 1.5, 0.2]} position={[0.5, -0.5, 0.5]} rotation={[0, 0, -0.5]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
      </Box>

      {/* Confetti particles */}
      <Sphere args={[0.1, 8, 8]} position={[1, 1, 1]}>
        <meshStandardMaterial color="#FFD700" />
      </Sphere>
      <Sphere args={[0.1, 8, 8]} position={[-1, 1, -1]}>
        <meshStandardMaterial color="#FF1493" />
      </Sphere>
      <Sphere args={[0.1, 8, 8]} position={[1, -1, -1]}>
        <meshStandardMaterial color="#00D9FF" />
      </Sphere>

      {/* Lights */}
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={1.2} color="#00FF00" />
      <pointLight position={[-2, -2, 2]} intensity={1} color="#FFD700" />
    </group>
  )
}

export function Checkout3DAnimation({
  status = 'processing',
  bookingId,
  totalAmount,
}: Checkout3DProps) {
  const [displayStatus, setDisplayStatus] = useState(status)

  useEffect(() => {
    setDisplayStatus(status)
  }, [status])

  const getStatusMessage = () => {
    switch (displayStatus) {
      case 'processing':
        return 'Processing Payment...'
      case 'success':
        return 'Payment Successful!'
      case 'failed':
        return 'Payment Failed'
      default:
        return 'Processing'
    }
  }

  const getStatusColor = () => {
    switch (displayStatus) {
      case 'processing':
        return 'from-cyan-500 to-pink-500'
      case 'success':
        return 'from-green-500 to-emerald-500'
      case 'failed':
        return 'from-red-500 to-orange-500'
      default:
        return 'from-cyan-500 to-pink-500'
    }
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
        {displayStatus === 'processing' && <ProcessingAnimation />}
        {displayStatus === 'success' && <SuccessAnimation />}
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 2, 10]} />
      </Canvas>

      {/* Status overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="mb-8">
          <h2 className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getStatusColor()}`}>
            {getStatusMessage()}
          </h2>
        </div>

        {bookingId && (
          <div className="text-gray-400 text-center">
            <p className="text-sm mb-2">Booking ID</p>
            <p className="font-mono text-cyan-400">{bookingId}</p>
          </div>
        )}

        {totalAmount && (
          <div className="mt-4 text-gray-400 text-center">
            <p className="text-sm mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-green-400">₹{totalAmount}</p>
          </div>
        )}

        {displayStatus === 'failed' && (
          <div className="mt-6 text-red-400 text-center text-sm">
            <p>Transaction declined</p>
            <p className="mt-2">Please try again</p>
          </div>
        )}
      </div>

      {/* Loading indicator for processing */}
      {displayStatus === 'processing' && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}
