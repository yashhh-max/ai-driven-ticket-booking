'use client'

import Link from 'next/link'
import { BookingCard } from '@/components/booking-card'
import { Booking, Showtime, Movie, Theater, BookedSeat, Seat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ticket, Film } from 'lucide-react'

type FullBooking = Booking & {
  showtime: Showtime & { movie: Movie; theater: Theater }
  booked_seats: (BookedSeat & { seat: Seat })[]
}

interface MyBookingsClientProps {
  allBookings: FullBooking[]
}

export function MyBookingsClient({ allBookings }: MyBookingsClientProps) {
  // Separate upcoming and past bookings
  const now = new Date()
  const upcomingBookings = allBookings.filter(
    (b) => new Date(b.showtime.start_time) > now && b.status !== 'cancelled'
  )
  const pastBookings = allBookings.filter(
    (b) => new Date(b.showtime.start_time) <= now || b.status === 'cancelled'
  )

  if (allBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center">
        <Ticket className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">No bookings yet</h2>
        <p className="mb-6 text-muted-foreground">
          You have not booked any movie tickets yet
        </p>
        <Button asChild>
          <Link href="/">
            <Film className="mr-2 h-4 w-4" />
            Browse Movies
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          Upcoming
          {upcomingBookings.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {upcomingBookings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="past" className="flex items-center gap-2">
          Past
          {pastBookings.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
              {pastBookings.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
            <p className="mb-4 text-muted-foreground">No upcoming bookings</p>
            <Button asChild>
              <Link href="/">Browse Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        {pastBookings.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-12 text-center">
            <p className="text-muted-foreground">No past bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
