'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Canvas3DCarousel = dynamic(
  () => import('./carousel-3d-canvas').then(mod => mod.Carousel3DCanvas),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-gray-400">Loading 3D carousel...</div>
  }
)

export function Movie3DCarouselWrapper({ movies }: { movies: any[] }) {
  if (!movies || movies.length === 0) {
    return <div className="w-full h-full bg-background flex items-center justify-center">No movies available</div>
  }

  return (
    <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center">Loading...</div>}>
      <Canvas3DCarousel movies={movies} />
    </Suspense>
  )
}
