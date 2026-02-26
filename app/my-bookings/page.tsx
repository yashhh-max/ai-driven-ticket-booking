import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Booking, Showtime, Movie, Theater, BookedSeat, Seat } from '@/lib/types'
import { MyBookingsClient } from './my-bookings-client'

export default async function MyBookingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all bookings for the user
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      showtime:showtimes(
        *,
        movie:movies(*),
        theater:theaters(*)
      ),
      booked_seats(
        *,
        seat:seats(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  type FullBooking = Booking & {
    showtime: Showtime & { movie: Movie; theater: Theater }
    booked_seats: (BookedSeat & { seat: Seat })[]
  }

  const allBookings = (bookings || []) as FullBooking[]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your movie ticket bookings
          </p>
        </div>

        <MyBookingsClient allBookings={allBookings} />
      </main>
    </div>
  )
}
