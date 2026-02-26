import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: methods, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })

    if (error) throw error

    return NextResponse.json({ methods })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
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
    const { payment_type, card_last_four, card_brand, card_holder_name, expiry_month, expiry_year, is_default } = body

    // Validate card details
    if (payment_type === 'card') {
      if (!card_last_four || !card_brand || !card_holder_name || !expiry_month || !expiry_year) {
        return NextResponse.json(
          { error: 'All card fields are required' },
          { status: 400 }
        )
      }

      if (expiry_month < 1 || expiry_month > 12) {
        return NextResponse.json(
          { error: 'Invalid expiry month' },
          { status: 400 }
        )
      }
    }

    // If setting as default, unset others
    if (is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: method, error } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: user.id,
        payment_type,
        card_last_four,
        card_brand,
        card_holder_name,
        expiry_month,
        expiry_year,
        is_default: is_default || false,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ method }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}
