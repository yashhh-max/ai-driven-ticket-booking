'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { WishlistMovie } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, Film } from 'lucide-react'
import Link from 'next/link'

export default function WishlistSection() {
  const [wishlist, setWishlist] = useState<WishlistMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      setLoading(true)
      const data = await accountAPI.getWishlist()
      setWishlist(data.wishlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      setDeleting(id)
      await accountAPI.removeFromWishlist(id)
      setWishlist(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Wishlist</CardTitle>
        <CardDescription>Movies you want to watch</CardDescription>
      </CardHeader>
      <CardContent>
        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">No movies in your wishlist yet</p>
            <Button asChild>
              <Link href="/movies">Browse Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                {item.movie?.poster_url && (
                  <img
                    src={item.movie.poster_url}
                    alt={item.movie.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="font-semibold line-clamp-2 mb-2">{item.movie?.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.movie?.description}</p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/movies/${item.movie?.id}`}>View Details</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(item.id)}
                    disabled={deleting === item.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mt-4">{error}</div>}
      </CardContent>
    </Card>
  )
}
