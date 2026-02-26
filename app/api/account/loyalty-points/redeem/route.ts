import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: redemptions, error } = await supabase
      .from('points_redemption')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ redemptions })
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
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
    const { points_amount, redemption_type } = body

    if (!points_amount || !redemption_type) {
      return NextResponse.json(
        { error: 'points_amount and redemption_type are required' },
        { status: 400 }
      )
    }

    // Get user's loyalty points
    const { data: loyalty, error: loyaltyError } = await supabase
      .from('user_loyalty_points')
      .select('available_points')
      .eq('user_id', user.id)
      .single()

    if (loyaltyError) throw loyaltyError

    if (!loyalty || loyalty.available_points < points_amount) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    // Create redemption request
    const { data: redemption, error } = await supabase
      .from('points_redemption')
      .insert({
        user_id: user.id,
        points_amount,
        redemption_type,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ redemption }, { status: 201 })
  } catch (error) {
    console.error('Error creating redemption:', error)
    return NextResponse.json(
      { error: 'Failed to create redemption' },
      { status: 500 }
    )
  }
}
