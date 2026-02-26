import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: wishlist, error } = await supabase
      .from('user_wishlist')
      .select(`
        *,
        movie:movies(*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ wishlist })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { movie_id } = body

    if (!movie_id) {
      return NextResponse.json(
        { error: 'movie_id is required' },
        { status: 400 }
      )
    }

    const { data: item, error } = await supabase
      .from('user_wishlist')
      .insert({
        user_id: user.id,
        movie_id
      })
      .select(`
        *,
        movie:movies(*)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Movie already in wishlist' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}
