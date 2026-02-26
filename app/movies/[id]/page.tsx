import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ShowtimeCard } from '@/components/showtime-card'
import { Movie, Showtime } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Star, Calendar, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch movie details
  const { data: movie, error: movieError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single()

  if (movieError || !movie) {
    notFound()
  }

  // Fetch upcoming showtimes for this movie
  const today = new Date().toISOString().split('T')[0]
  const { data: showtimes, error: showtimesError } = await supabase
    .from('showtimes')
    .select(`
      *,
      theater:theaters(*)
    `)
    .eq('movie_id', id)
    .gte('show_date', today)
    .eq('is_active', true)
    .order('show_date', { ascending: true })
    .order('show_time', { ascending: true })

  if (showtimesError) {
    console.error('Error fetching showtimes:', showtimesError)
  }

  const typedMovie = movie as Movie
  const typedShowtimes = (showtimes || []) as Showtime[]

  // Map movie title to poster filename
  const getPosterUrl = (url: string | null, title: string) => {
    if (!url) return "/placeholder.svg";
    
    // If URL is already a local path, use it
    if (url.startsWith('/')) return url;
    
    // Map database movie titles to local JPG files
    const titleMap: Record<string, string> = {
      'Spirit': '/posters/spirit.jpg',
      'Varanasi': '/posters/varanasi.jpg',
      'Dune: Part Three': '/posters/dune3.jpg',
      'Echoes of Tomorrow': '/posters/echoes.jpg',
      'Shadow Protocol': '/posters/shadow.jpg',
      'The Last Horizon': '/posters/horizon.jpg',
      'The Laughing Man': '/posters/laughing.jpg',
      'Midnight in Paris 2': '/posters/paris2.jpg',
    };
    
    return titleMap[title] || "/placeholder.svg";
  };

  const posterUrl = getPosterUrl(typedMovie.poster_url, typedMovie.title)

  // Group showtimes by date
  const showtimesByDate = typedShowtimes.reduce(
    (acc, showtime) => {
      const date = showtime.show_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(showtime)
      return acc
    },
    {} as Record<string, Showtime[]>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Link>
        </Button>

        {/* Movie Details */}
        <div className="mb-12 grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
            <img
              src={posterUrl}
              alt={typedMovie.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <Badge variant="secondary" className="mb-3">
                {typedMovie.genre}
              </Badge>
              <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                <span className="text-balance">{typedMovie.title}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  {typedMovie.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  {typedMovie.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(typedMovie.release_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Synopsis</h2>
              <p className="text-muted-foreground leading-relaxed">
                <span className="text-pretty">{typedMovie.description}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Showtimes */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-foreground">Available Showtimes</h2>
          
          {Object.keys(showtimesByDate).length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No showtimes available for this movie</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(showtimesByDate).map(([date, dateShowtimes]) => (
                <div key={date}>
                  <h3 className="mb-4 text-lg font-medium text-foreground">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dateShowtimes.map((showtime) => (
                      <ShowtimeCard key={showtime.id} showtime={showtime} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
