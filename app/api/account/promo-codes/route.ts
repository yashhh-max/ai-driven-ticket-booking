import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get available promo codes (anyone can view)
    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .gt('valid_until', new Date().toISOString())
      .lt('valid_from', new Date().toISOString())

    if (error) throw error

    return NextResponse.json({ promoCodes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}
