'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Sphere, Box } from '@react-three/drei'
import * as THREE from 'three'
import { createClient } from '@/lib/supabase/client'
import { SeatWithStatus } from '@/lib/types'
import { toast } from 'sonner'

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
}: {
  showtimeId: string
  theaterId: string
  userId: string | null
  basePrice: number
  onSelectionChange: (seats: SeatWithStatus[], total: number) => void
}) {
  const [seats, setSeats] = useState<SeatWithStatus[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch seats and their status
  const fetchSeats = useCallback(async () => {
    // Get all seats for the theater
    const { data: theaterSeats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .eq('theater_id', theaterId)
      .order('row_label')
      .order('seat_number')

    if (seatsError) {
      console.error('Error fetching seats:', seatsError.message || JSON.stringify(seatsError))
      return
    }

    // Get booked seats for this showtime
    const { data: bookedSeats, error: bookedError } = await supabase
      .from('booked_seats')
      .select('seat_id, booking:bookings!inner(status)')
      .eq('booking.showtime_id', showtimeId)
      .in('booking.status', ['pending', 'confirmed'])

    if (bookedError) {
      console.error('Error fetching booked seats:', bookedError.message || JSON.stringify(bookedError))
    }

    // Get locked seats for this showtime
    const { data: lockedSeats, error: lockedError } = await supabase
      .from('seat_locks')
      .select('seat_id, user_id')
      .eq('showtime_id', showtimeId)
      .gt('expires_at', new Date().toISOString())

    if (lockedError) {
      console.error('Error fetching locked seats:', lockedError.message || JSON.stringify(lockedError))
    }

    const bookedSeatIds = new Set((bookedSeats || []).map((bs) => bs.seat_id))
    const lockedSeatMap = new Map(
      (lockedSeats || []).map((ls) => [ls.seat_id, ls.user_id])
    )

    // Map seats with their status
    const seatsWithStatus: SeatWithStatus[] = (theaterSeats || []).map((seat) => {
      let status: SeatWithStatus['status'] = 'available'
      
      if (bookedSeatIds.has(seat.id)) {
        status = 'booked'
      } else if (lockedSeatMap.has(seat.id)) {
        // If locked by current user, show as selected
        if (lockedSeatMap.get(seat.id) === userId) {
          status = 'selected'
        } else {
          status = 'locked'
        }
      } else if (selectedSeats.has(seat.id)) {
        status = 'selected'
      }

      return { ...seat, status }
    })

    setSeats(seatsWithStatus)
    setLoading(false)
  }, [supabase, theaterId, showtimeId, userId])

  useEffect(() => {
    fetchSeats()

    // Set up real-time subscription for seat updates
    const channel = supabase
      .channel(`seats-3d-${showtimeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booked_seats',
        },
        () => {
          fetchSeats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_locks',
        },
        () => {
          fetchSeats()
        }
      )
      .subscribe()

    // Refresh every 30 seconds to handle lock expirations
    const interval = setInterval(fetchSeats, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase, showtimeId, fetchSeats])

  // Update parent when selection changes
  useEffect(() => {
    const selected = seats.filter((s) => selectedSeats.has(s.id))
    const total = selected.reduce((sum, seat) => {
      const multiplier = seat.seat_type === 'vip' ? 1.5 : seat.seat_type === 'premium' ? 1.25 : 1
      return sum + basePrice * multiplier
    }, 0)
    onSelectionChange(selected, total)
  }, [selectedSeats, seats, basePrice, onSelectionChange])

  const handleSeatClick = async (seatId: string) => {
    if (!userId) {
      toast.error('Please sign in to select seats')
      return
    }

    const seat = seats.find(s => s.id === seatId)
    if (!seat || seat.status === 'booked' || seat.status === 'locked') {
      return
    }

    const newSelection = new Set(selectedSeats)
    
    if (selectedSeats.has(seatId)) {
      // Deselect seat
      newSelection.delete(seatId)
      
      // Remove lock
      await supabase
        .from('seat_locks')
        .delete()
        .eq('seat_id', seatId)
        .eq('user_id', userId)
    } else {
      // Check max seats limit
      if (newSelection.size >= 10) {
        toast.error('Maximum 10 seats per booking')
        return
      }

      // Select seat and create/update lock
      newSelection.add(seatId)
      
      // First check if lock already exists
      const { data: existingLock } = await supabase
        .from('seat_locks')
        .select('id')
        .eq('seat_id', seatId)
        .eq('showtime_id', showtimeId)
        .single()
      
      let error
      
      if (existingLock) {
        // Update existing lock
        const { error: updateError } = await supabase
          .from('seat_locks')
          .update({
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            user_id: userId
          })
          .eq('id', existingLock.id)
        
        error = updateError
      } else {
        // Create new lock
        const { error: insertError } = await supabase
          .from('seat_locks')
          .insert({
            seat_id: seatId,
            showtime_id: showtimeId,
            user_id: userId,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
        
        error = insertError
      }

      if (error) {
        console.error('Error locking seat:', error.message || JSON.stringify(error))
        newSelection.delete(seatId)
        toast.error('Failed to reserve seat. It may have been taken.')
        fetchSeats()
        return
      }
    }

    setSelectedSeats(newSelection)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-lg overflow-hidden relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
        <Theater3D
          seats={seats}
          selectedSeats={selectedSeats}
          lockedSeats={lockedSeats}
          onSeatClick={handleSeatClick}
        />
        <OrbitControls
          maxDistance={15}
          minDistance={3}
          maxPolarAngle={Math.PI / 2.1}
        />
        <color attach="background" args={['#07070e']} />
        <fog attach="fog" args={['#07070e', 5, 20]} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur p-4 rounded-lg border border-gray-800">
        <h3 className="text-white font-semibold text-sm mb-1">3D Theater View</h3>
        <p className="text-gray-300 text-xs mb-3">
          Drag to rotate • Scroll to zoom • Click a seat to select. (Selected: {selectedSeats.size})
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded"></div>
            <span className="text-gray-400">Standard</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded"></div>
            <span className="text-gray-400">Premium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-pink-500 rounded"></div>
            <span className="text-gray-400">VIP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
            <span className="text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-green-400 rounded"></div>
            <span className="text-gray-400">Selected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
