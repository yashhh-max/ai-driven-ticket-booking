import { createClient } from '@/lib/supabase/server'
import { HomePageClient } from '@/components/home-page-client'
import { Movie } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  
  let movies: Movie[] = []
  let isAuthenticated = false
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    isAuthenticated = !!session
    
    const response = await supabase
      .from('movies')
      .select('*')
      .order('release_date', { ascending: false })
    
    if (response.data) {
      movies = response.data as Movie[]
    }
  } catch (err) {
    console.error('Error fetching movies:', err)
  }

  return <HomePageClient movies={movies} isAuthenticated={isAuthenticated} />
}
