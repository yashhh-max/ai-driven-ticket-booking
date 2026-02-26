import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: history, error } = await supabase
      .from('loyalty_points_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching points history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points history' },
      { status: 500 }
    )
  }
}
