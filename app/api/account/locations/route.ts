import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: locations, error } = await supabase
      .from('user_saved_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })

    if (error) throw error

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
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
    const { location_type, city, state, address, theatre_id, is_default } = body

    if (!location_type || !city) {
      return NextResponse.json(
        { error: 'location_type and city are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset others
    if (is_default) {
      await supabase
        .from('user_saved_locations')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: location, error } = await supabase
      .from('user_saved_locations')
      .insert({
        user_id: user.id,
        location_type,
        city,
        state,
        address,
        theatre_id,
        is_default: is_default || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
