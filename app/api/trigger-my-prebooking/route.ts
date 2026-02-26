import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This API allows a user to manually trigger processing of their own pre-bookings
// Useful for testing or when user wants immediate processing
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[trigger-prebooking] User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preBookingId } = body

    if (!preBookingId) {
      console.error('[trigger-prebooking] Missing preBookingId')
      return NextResponse.json({ error: 'preBookingId is required' }, { status: 400 })
    }

    console.log('[trigger-prebooking] Processing for user:', user.id, 'preBooking:', preBookingId)

    // Verify the pre-booking belongs to this user
    const { data: preBooking, error: fetchError } = await supabase
      .from('pre_bookings')
      .select('*, showtime:showtimes(ticket_release_time, movie:movies(title))')
      .eq('id', preBookingId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('[trigger-prebooking] Error fetching pre-booking:', fetchError)
      return NextResponse.json({ error: 'Pre-booking not found: ' + fetchError.message }, { status: 404 })
    }

    if (!preBooking) {
      console.error('[trigger-prebooking] Pre-booking not found')
      return NextResponse.json({ error: 'Pre-booking not found' }, { status: 404 })
    }

    console.log('[trigger-prebooking] Pre-booking status:', preBooking.status)

    if (preBooking.status !== 'queued') {
      console.log('[trigger-prebooking] Pre-booking not in queued status:', preBooking.status)
      return NextResponse.json({ 
        error: `Pre-booking is not in queued status (current: ${preBooking.status})`,
        currentStatus: preBooking.status 
      }, { status: 400 })
    }

    // Check if tickets are released
    const releaseTime = preBooking.showtime?.ticket_release_time
    if (releaseTime && new Date(releaseTime) > new Date()) {
      console.log('[trigger-prebooking] Tickets not yet released:', releaseTime)
      return NextResponse.json({ 
        error: 'Tickets are not yet released',
        releaseTime 
      }, { status: 400 })
    }

    console.log('[trigger-prebooking] Calling RPC process_pre_booking...')

    // Process the pre-booking (this now includes notifications via trigger)
    const { data: result, error: processError } = await supabase
      .rpc('process_pre_booking', { p_pre_booking_id: preBookingId })

    if (processError) {
      console.error('[trigger-prebooking] RPC Error:', processError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to process: ' + processError.message,
        details: processError
      }, { status: 500 })
    }

    console.log('[trigger-prebooking] RPC Result:', result)

    // Handle the RPC response
    if (!result) {
      console.error('[trigger-prebooking] RPC returned null result')
      return NextResponse.json({ 
        success: false,
        error: 'Processing returned no result'
      }, { status: 500 })
    }

    // RPC returns a JSON object
    const success = result.success === true
    const bookingId = result.booking_id
    const errorMsg = result.error

    if (!success) {
      console.log('[trigger-prebooking] RPC returned failure:', errorMsg)
      return NextResponse.json({
        success: false,
        error: errorMsg || 'Booking processing failed'
      }, { status: 400 })
    }

    console.log('[trigger-prebooking] Successfully processed booking:', bookingId)

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      message: 'Booking processed successfully'
    })
  } catch (error) {
    console.error('[trigger-prebooking] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + String(error),
      success: false 
    }, { status: 500 })
  }
}
