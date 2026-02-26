import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gt('valid_until', new Date().toISOString())
      .lt('valid_from', new Date().toISOString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invalid or expired promo code' },
          { status: 404 }
        )
      }
      throw error
    }

    // Check if usage limit reached
    if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
      return NextResponse.json(
        { error: 'Promo code usage limit exceeded' },
        { status: 400 }
      )
    }

    return NextResponse.json({ promoCode })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}
