'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Movie } from '@/lib/types'

export default function AdminPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [posterUpdates, setPosterUpdates] = useState<Record<string, { poster: string; backdrop: string }>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('title')

    if (error) {
      console.error('Error fetching movies:', error)
    } else {
      setMovies(data || [])
      // Initialize with current values
      const initial: Record<string, { poster: string; backdrop: string }> = {}
      data?.forEach((movie) => {
        initial[movie.id] = {
          poster: movie.poster_url || '',
          backdrop: movie.backdrop_url || '',
        }
      })
      setPosterUpdates(initial)
    }
    setLoading(false)
  }

  const updatePosterUrl = (movieId: string, field: 'poster' | 'backdrop', value: string) => {
    setPosterUpdates((prev) => ({
      ...prev,
      [movieId]: {
        ...prev[movieId],
        [field === 'poster' ? 'poster_url' : 'backdrop_url']: value,
      },
    }))
  }

  const savePosterUrl = async (movieId: string) => {
    const updates = posterUpdates[movieId]
    if (!updates) return

    const { error } = await supabase
      .from('movies')
      .update({
        poster_url: updates.poster,
        backdrop_url: updates.backdrop,
      })
      .eq('id', movieId)

    if (error) {
      console.error('Error updating poster:', error)
      alert('Error updating poster')
    } else {
      alert('Poster updated successfully')
      fetchMovies()
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold">Movie Poster Manager</h1>
        
        <div className="mb-8 rounded-lg border border-blue-500 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-900">How to Add Posters:</h2>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
            <li>Save your poster image to: <code className="bg-white px-2 py-1">public/posters/</code></li>
            <li>Save your backdrop image to: <code className="bg-white px-2 py-1">public/backdrops/</code></li>
            <li>Enter the path below (e.g., <code className="bg-white px-2 py-1">/posters/myimage.jpg</code>)</li>
            <li>Click "Save" to update the movie</li>
          </ol>
        </div>

        <div className="grid gap-6">
          {movies.map((movie) => (
            <Card key={movie.id}>
              <CardHeader>
                <CardTitle>{movie.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Poster Preview */}
                <div className="flex gap-6">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold">Poster Preview</h3>
                    {posterUpdates[movie.id]?.poster && (
                      <img
                        src={posterUpdates[movie.id].poster}
                        alt="Poster preview"
                        className="mb-4 max-h-64 rounded border"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold">Backdrop Preview</h3>
                    {posterUpdates[movie.id]?.backdrop && (
                      <img
                        src={posterUpdates[movie.id].backdrop}
                        alt="Backdrop preview"
                        className="mb-4 max-h-40 rounded border"
                      />
                    )}
                  </div>
                </div>

                {/* Poster URL Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Poster URL</label>
                  <Input
                    placeholder="/posters/image.jpg"
                    value={posterUpdates[movie.id]?.poster || ''}
                    onChange={(e) => updatePosterUrl(movie.id, 'poster', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {movie.poster_url}
                  </p>
                </div>

                {/* Backdrop URL Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Backdrop URL</label>
                  <Input
                    placeholder="/backdrops/image.jpg"
                    value={posterUpdates[movie.id]?.backdrop || ''}
                    onChange={(e) => updatePosterUrl(movie.id, 'backdrop', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {movie.backdrop_url}
                  </p>
                </div>

                <Button onClick={() => savePosterUrl(movie.id)} className="w-full">
                  Save Poster URLs
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
