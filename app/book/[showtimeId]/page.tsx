import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { BookingClient } from './booking-client'
import { Showtime, Movie, Theater } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface BookingPageProps {
  params: Promise<{ showtimeId: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { showtimeId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch showtime with movie and theater details
  const { data: showtime, error } = await supabase
    .from('showtimes')
    .select(`
      *,
      movie:movies(*),
      theater:theaters(*)
    `)
    .eq('id', showtimeId)
    .single()

  if (error || !showtime) {
    notFound()
  }

  // Check if showtime is in the past
  // Only check if the date itself is in the past, not the exact time (to avoid timezone issues)
  const [year, month, day] = showtime.show_date.split('-').map(Number)
  const showDate = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  console.log('Booking Page Debug:', {
    showtimeId,
    showDate: showtime.show_date,
    showTime: showtime.show_time,
    today: today.toISOString(),
    isPast: showDate < today,
    movieId: showtime.movie_id,
  })
  
  // Only redirect if the show date is in the past
  if (showDate < today) {
    console.log('Redirecting to home because showtime date is in the past')
    redirect('/')
  }

  const typedShowtime = showtime as Showtime & { movie: Movie; theater: Theater }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href={`/movies/${typedShowtime.movie_id}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Movie
          </Link>
        </Button>

        {/* Movie Info Header */}
        <div className="mb-8 flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md">
            <Image
              src={typedShowtime.movie.poster_url || "/placeholder.svg"}
              alt={typedShowtime.movie.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2">
              {typedShowtime.movie.genre}
            </Badge>
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              {typedShowtime.movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(typedShowtime.show_date), 'EEE, MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(`${typedShowtime.show_date}T${typedShowtime.show_time}`), 'h:mm a')}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {typedShowtime.theater.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Starting from</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(typedShowtime.price)}</p>
          </div>
        </div>

        {/* Seat Selection */}
        <BookingClient
          showtime={typedShowtime}
          userId={user?.id || null}
        />
      </main>
    </div>
  )
}
