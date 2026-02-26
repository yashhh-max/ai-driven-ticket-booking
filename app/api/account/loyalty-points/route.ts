import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: loyalty, error } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      loyalty: loyalty || {
        user_id: user.id,
        total_points: 0,
        available_points: 0,
        redeemed_points: 0,
        lifetime_points: 0
      }
    })
  } catch (error) {
    console.error('Error fetching loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points' },
      { status: 500 }
    )
  }
}
