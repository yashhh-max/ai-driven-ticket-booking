'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Movie } from '@/lib/types'

const Cinema3DScene = dynamic(() =>
  import('@/components/3d-cinema-scene').then((mod) => mod.Cinema3DScene),
  { ssr: false }
)

interface Home3DClientProps {
  movies: Movie[]
}

export function Home3DClient({ movies }: Home3DClientProps) {
  const router = useRouter()
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null)

  const handleMovieSelect = (movieId: string) => {
    setSelectedMovieId(movieId)
    // Navigate to movie details after 1 second
    setTimeout(() => {
      router.push(`/movies/${movieId}`)
    }, 800)
  }

  return (
    <div className="w-full h-screen">
      <Cinema3DScene
        movies={movies}
        onMovieSelect={handleMovieSelect}
        interactive={true}
      />

      {/* Info Panel */}
      <div className="absolute bottom-8 left-8 right-8 bg-black/50 backdrop-blur-md p-6 rounded-lg text-white border border-purple-500/30 max-w-md">
        <h2 className="text-xl font-bold mb-2">Welcome to AuroSeat 3D</h2>
        <p className="text-gray-300 text-sm mb-4">
          Explore our immersive cinema experience. Click on movie posters to view details and book tickets.
        </p>
        <p className="text-gray-400 text-xs">
          Use your mouse to rotate, zoom, and pan through the cinema. Auto-rotate is enabled.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="absolute top-8 right-8 flex gap-4">
        <a
          href="/my-bookings"
          className="px-4 py-2 bg-purple-600/80 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
        >
          My Bookings
        </a>
        <a
          href="/wallet"
          className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          Wallet
        </a>
      </div>
    </div>
  )
}
