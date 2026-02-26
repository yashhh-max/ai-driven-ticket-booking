import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: usage, error } = await supabase
      .from('user_promo_usage')
      .select(`
        *,
        promo_code:promo_codes(*)
      `)
      .eq('user_id', user.id)
      .order('used_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ usage })
  } catch (error) {
    console.error('Error fetching promo usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo usage' },
      { status: 500 }
    )
  }
}
