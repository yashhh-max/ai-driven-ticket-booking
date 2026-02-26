'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SeatSelector } from '@/components/seat-selector'
import { Showtime, Movie, Theater, SeatWithStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingClientProps {
  showtime: Showtime & { movie: Movie; theater: Theater }
  userId: string | null
}

export function BookingClient({ showtime, userId }: BookingClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedSeats, setSelectedSeats] = useState<SeatWithStatus[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isBooking, setIsBooking] = useState(false)
  const supabase = createClient()

  const handleSelectionChange = useCallback((seats: SeatWithStatus[], total: number) => {
    setSelectedSeats(seats)
    setTotalAmount(total)
  }, [])

  const handleBooking = async () => {
    if (!userId) {
      toast.error('Please sign in to complete your booking')
      router.push('/auth/login?redirect=' + pathname)
      return
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }

    setIsBooking(true)

    try {
      // Check if any selected seats are already booked
      const seatIds = selectedSeats.map(s => s.id)
      const { data: existingBookings, error: checkError } = await supabase
        .from('booked_seats')
        .select('seat_id')
        .eq('showtime_id', showtime.id)
        .in('seat_id', seatIds)

      if (checkError) throw checkError
      
      if (existingBookings && existingBookings.length > 0) {
        toast.error('One or more selected seats have been booked by another user. Please refresh and select different seats.')
        // Refresh the seat status
        window.location.reload()
        return
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          showtime_id: showtime.id,
          total_amount: totalAmount,
          status: 'pending',
          booking_reference: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create booked seats
      const bookedSeats = selectedSeats.map((seat) => {
        return {
          booking_id: booking.id,
          showtime_id: showtime.id,
          seat_id: seat.id,
        }
      })

      const { error: seatsError } = await supabase
        .from('booked_seats')
        .insert(bookedSeats)

      if (seatsError) {
        // If seats error is due to duplicate key (already booked), delete the booking and retry
        if (seatsError.message && seatsError.message.includes('duplicate key')) {
          // Delete the booking we just created
          await supabase
            .from('bookings')
            .delete()
            .eq('id', booking.id)
          
          toast.error('One or more selected seats have been booked by another user. Please refresh and select different seats.')
          // Refresh the seat status
          window.location.reload()
          return
        }
        throw seatsError
      }

      // Clear seat locks for this user
      await supabase
        .from('seat_locks')
        .delete()
        .eq('user_id', userId)
        .eq('showtime_id', showtime.id)

      // Redirect to checkout/confirmation
      router.push(`/checkout/${booking.id}`)
    } catch (error) {
      console.error('Booking error:', error instanceof Error ? error.message : JSON.stringify(error))
      
      // Provide specific error messages based on error type
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      if (errorMessage.includes('duplicate key')) {
        toast.error('One or more seats are already booked. Please refresh and try again.')
      } else if (errorMessage.includes('auth')) {
        toast.error('Authentication error. Please sign in again.')
      } else {
        toast.error('Failed to create booking. Please try again.')
      }
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
      {/* Seat Selection Area */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Select Your Seats</CardTitle>
        </CardHeader>
        <CardContent>
          <SeatSelector
            showtimeId={showtime.id}
            theaterId={showtime.theater_id}
            userId={userId}
            basePrice={showtime.price}
            onSelectionChange={handleSelectionChange}
          />
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-foreground">{showtime.movie.title}</p>
              <p className="text-sm text-muted-foreground">{showtime.theater.name}</p>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Selected Seats</p>
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No seats selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats
                    .sort((a, b) => {
                      if (a.row_label !== b.row_label) {
                        return a.row_label.localeCompare(b.row_label)
                      }
                      return a.seat_number - b.seat_number
                    })
                    .map((seat) => (
                      <span
                        key={seat.id}
                        className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                      >
                        {seat.row_label}{seat.seat_number}
                        {seat.seat_type !== 'standard' && ` (${seat.seat_type})`}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tickets ({selectedSeats.length})</span>
                  <span className="text-foreground">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking Fee</span>
                  <span className="text-foreground">{formatCurrency(69)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                    {selectedSeats.length > 0 ? formatCurrency(totalAmount + 69) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            {!userId ? (
              <Button className="w-full" asChild>
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(pathname)}`}>Sign in to Book</Link>
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Seats are held for 10 minutes during selection
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
