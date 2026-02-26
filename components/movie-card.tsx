import Link from 'next/link'
import { Movie } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Star } from 'lucide-react'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  // Convert movie title to poster filename if needed
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

  const posterUrl = getPosterUrl(movie.poster_url, movie.title);

  return (
    <Link href={`/movies/${movie.id}`}>
      <Card className="group overflow-hidden bg-card transition-all hover:ring-2 hover:ring-primary/50 [perspective:1200px] hover:[transform:rotateY(8deg)_rotateX(-8deg)_translateZ(20px)] hover:shadow-lg">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge variant="secondary" className="mb-2">
              {movie.genre}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground">
            {movie.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {movie.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {movie.rating}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
