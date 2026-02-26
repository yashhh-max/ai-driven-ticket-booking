'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Sphere, Box } from '@react-three/drei'
import * as THREE from 'three'

interface Seat3DProps {
  row: number
  seatNumber: number
  isSelected: boolean
  isBooked: boolean
  isLocked: boolean
  onClick: () => void
  seatType: 'standard' | 'premium' | 'vip'
}

function Seat3D({ row, seatNumber, isSelected, isBooked, isLocked, onClick, seatType }: Seat3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      
      // Scale animation on hover
      if (hovered && !isBooked) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }
    }
  })

  // Determine color based on state
  const getColor = () => {
    if (isBooked) return '#FF6B6B'
    if (isSelected) return '#4ECDC4'
    if (isLocked) return '#FFD93D'
    if (seatType === 'vip') return '#FF006E'
    if (seatType === 'premium') return '#8338EC'
    return '#3A86FF'
  }

  return (
    <mesh
      ref={meshRef}
      position={[seatNumber * 0.8, row * 0.8, 0]}
      onClick={onClick}
      onPointerEnter={() => !isBooked && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Box args={[0.6, 0.6, 0.3]}>
        <meshStandardMaterial
          color={getColor()}
          emissive={isSelected ? '#00FF00' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : 0}
          metalness={0.6}
          roughness={0.4}
        />
      </Box>
    </mesh>
  )
}

interface Theater3DProps {
  seats: any[]
  selectedSeats: Set<string>
  lockedSeats: Set<string>
  onSeatClick: (seatId: string) => void
}

function Theater3D({ seats, selectedSeats, lockedSeats, onSeatClick }: Theater3DProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.0001
    }
  })

  return (
    <group ref={groupRef}>
      {/* Screen */}
      <mesh position={[0, -8, 0]}>
        <Box args={[20, 1, 0.2]}>
          <meshStandardMaterial color="#FF1493" emissive="#FF1493" emissiveIntensity={0.3} />
        </Box>
      </mesh>

      {/* Seats */}
      {seats.map((seat) => (
        <Seat3D
          key={seat.id}
          row={parseInt(seat.row_label.charCodeAt(0)) - 65}
          seatNumber={seat.seat_number}
          isSelected={selectedSeats.has(seat.id)}
          isBooked={seat.status === 'booked'}
          isLocked={lockedSeats.has(seat.id)}
          onClick={() => onSeatClick(seat.id)}
          seatType={seat.seat_type}
        />
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#4ECDC4" />
    </group>
  )
}

export function SeatSelector3D({
  showtimeId,
  theaterId,
  userId,
  basePrice,
  onSelectionChange,
  seats: initialSeats,
}: {
  showtimeId: string
  theaterId: string
  userId: string | null
  basePrice: number
  onSelectionChange: (seats: any[], total: number) => void
  seats: any[]
}) {
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set())
  const [seats, setSeats] = useState(initialSeats)

  useEffect(() => {
    onSelectionChange(
      seats.filter(s => selectedSeats.has(s.id)),
      Array.from(selectedSeats).length * basePrice
    )
  }, [selectedSeats, seats, basePrice, onSelectionChange])

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats(prev => {
      const newSet = new Set(prev)
      if (newSet.has(seatId)) {
        newSet.delete(seatId)
      } else {
        newSet.add(seatId)
      }
      return newSet
    })
  }

  return (
    <div className="w-full h-screen bg-slate-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 5, 15]} fov={75} />
        <Theater3D
          seats={seats}
          selectedSeats={selectedSeats}
          lockedSeats={lockedSeats}
          onSeatClick={handleSeatClick}
        />
        <OrbitControls
          autoRotate
          autoRotateSpeed={2}
          maxDistance={25}
          minDistance={8}
        />
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 5, 50]} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute bottom-8 left-8 right-8 bg-black/80 backdrop-blur p-6 rounded-lg">
        <h3 className="text-white font-semibold mb-3">3D Theater View</h3>
        <p className="text-gray-300 text-sm mb-4">
          Selected: {selectedSeats.size} seat(s) | Total: ₹{selectedSeats.size * basePrice}
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded"></div>
            <span className="text-gray-300">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-300">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-300">Locked</span>
          </div>
        </div>
      </div>
    </div>
  )
}
