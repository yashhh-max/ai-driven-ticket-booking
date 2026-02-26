import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: refunds, error } = await supabase
      .from('user_refunds')
      .select(`
        *,
        booking:bookings(*)
      `)
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ refunds })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
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
    const { booking_id, reason, refund_amount } = body

    if (!booking_id || !reason) {
      return NextResponse.json(
        { error: 'booking_id and reason are required' },
        { status: 400 }
      )
    }

    // Verify booking ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, user_id, total_amount, status')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot refund a cancelled booking' },
        { status: 400 }
      )
    }

    const refundAmt = refund_amount || booking.total_amount

    const { data: refund, error } = await supabase
      .from('user_refunds')
      .insert({
        user_id: user.id,
        booking_id,
        refund_amount: refundAmt,
        reason,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ refund }, { status: 201 })
  } catch (error) {
    console.error('Error creating refund request:', error)
    return NextResponse.json(
      { error: 'Failed to create refund request' },
      { status: 500 }
    )
  }
}
