'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Movie } from '@/lib/types'
import { MovieGrid } from '@/components/movie-grid'
import { MovieCard } from '@/components/movie-card'
import { SearchFilter } from '@/components/search-filter'
import { TheatreList } from '@/components/theatre-list'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Zap, Brain, Wallet, User } from 'lucide-react'
import Link from 'next/link'

interface HomePageClientProps {
  movies: Movie[]
  isAuthenticated: boolean
}

export function HomePageClient({ movies, isAuthenticated }: HomePageClientProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filteredMovies, setFilteredMovies] = useState(movies)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [autoBookOnly, setAutoBookOnly] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleSearch = (query: string, location: string, filterAutoBook?: boolean) => {
    setSearchLoading(true)
    setSelectedLocation(location)
    setAutoBookOnly(filterAutoBook || false)
    
    // Filter movies based on search query and auto-booking availability
    let results = movies.filter((movie) => {
      const matchesQuery = 
        query === '' ||
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.description?.toLowerCase().includes(query.toLowerCase())
      
      // If auto-booking filter is active, check if movie has prebooking showtimes
      const matchesAutoBook = !filterAutoBook || (movie.has_prebooking === true)
      
      return matchesQuery && matchesAutoBook
    })

    setFilteredMovies(results)
    setSelectedMovie(null)
    setSearchLoading(false)
    
    // Store search params for potential multi-location feature
    if (location !== 'all') {
      console.log('Filtering by location:', location)
    }
  }

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Auth & Header Section */}
      <section className="py-6 bg-primary/5 border-b">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">AuroSeat</h1>
            <p className="text-muted-foreground text-sm">Your premiere movie booking platform</p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/auto-book" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Auto-Book
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-features" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Chatbot
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Hero Section */}


      {/* Search & Location Filter */}
      <section className="py-6 bg-black border-b">
        <div className="container mx-auto px-4">
          <SearchFilter onSearch={handleSearch} isLoading={searchLoading} />
        </div>
      </section>

      {/* All Movies Grid */}
      {!selectedMovie ? (
        filteredMovies.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {filteredMovies.length === movies.length ? 'All Movies' : 'Search Results'}
                  </h2>
                  <p className="text-muted-foreground">{filteredMovies.length} titles available</p>
                </div>
                {filteredMovies.length !== movies.length && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilteredMovies(movies)
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              {selectedLocation !== 'all' ? (
                // Show movies with "View Theatres" button when location is selected
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredMovies.map((movie) => (
                    <div key={movie.id} className="space-y-3">
                      <MovieCard movie={movie} />
                      <Button
                        className="w-full"
                        onClick={() => handleMovieClick(movie)}
                      >
                        View Theatres
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                // Show full movie grid when no location selected
                <MovieGrid movies={filteredMovies} />
              )}
            </div>
          </section>
        )
      ) : (
        // Show theatres for selected movie and location
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Button
              variant="outline"
              onClick={() => setSelectedMovie(null)}
              className="mb-6"
            >
              ← Back to Movies
            </Button>
            <TheatreList
              movieId={selectedMovie.id}
              movieTitle={selectedMovie.title}
              location={selectedLocation}
            />
          </div>
        </section>
      )}

      {filteredMovies.length === 0 && !searchLoading && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg text-muted-foreground mb-4">No movies found matching your search.</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilteredMovies(movies)
              }}
            >
              View All Movies
            </Button>
          </div>
        </section>
      )}

      {/* Auto-Booking Section */}
      {user && (
        <section className="py-16 bg-linear-to-r from-blue-600/10 to-cyan-600/10 border-b border-blue-200/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-lg border border-blue-200/30 bg-linear-to-r from-blue-950/40 to-cyan-950/40 p-8 shadow-lg">
                <div className="flex items-start gap-6 mb-6">
                  <div className="text-5xl">⚡</div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2">Smart Auto-Booking</h3>
                    <p className="text-muted-foreground text-lg">
                      Never miss your favorite movie! Set your preferences and let our intelligent system automatically book seats when your ideal showtime becomes available.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-background/50 border border-blue-200/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      Smart Preferences
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Choose your favorite movies, theaters, and showtimes
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-blue-200/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      Automatic Detection
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Our system monitors and books when conditions match
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-blue-200/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="text-lg">⏰</span>
                      Real-Time Updates
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Get instant notifications on booking status
                    </p>
                  </div>
                </div>

                <Link href="/auto-book">
                  <Button size="lg" className="w-full md:w-auto px-8 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <span className="text-lg mr-2">⚡</span>
                    Get Started with Auto-Booking
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-primary/5 border-t">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-12 text-center">Why Choose AuroSeat?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-background/50">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-bold mb-2">Instant Booking</h4>
              <p className="text-sm text-muted-foreground">Real-time seat selection and immediate confirmation</p>
            </div>
            <div className="p-6 rounded-lg bg-background/50">
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-bold mb-2">Secure Payments</h4>
              <p className="text-sm text-muted-foreground">Multiple payment options with secure checkout</p>
            </div>
            <div className="p-6 rounded-lg bg-background/50">
              <div className="text-3xl mb-4">🎬</div>
              <h4 className="font-bold mb-2">Diverse Selection</h4>
              <p className="text-sm text-muted-foreground">Wide range of genres and showtimes</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
