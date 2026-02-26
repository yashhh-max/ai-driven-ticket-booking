import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cron job to process queued pre-bookings when tickets are released
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all queued pre-bookings that are ready for processing
    const { data: readyBookings, error: fetchError } = await supabase
      .rpc('get_ready_pre_bookings')

    if (fetchError) {
      console.error('[auto-book] Error fetching ready bookings:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings', details: fetchError },
        { status: 500 }
      )
    }

    if (!readyBookings || readyBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pre-bookings ready for processing',
        processed: 0
      })
    }

    // Process each ready pre-booking
    let processedCount = 0
    let failedCount = 0
    const results = []

    for (const booking of readyBookings) {
      try {
        const { data: result, error: processError } = await supabase
          .rpc('process_pre_booking', { p_pre_booking_id: booking.pre_booking_id })

        if (processError) {
          console.error(`[auto-book] Error processing booking ${booking.pre_booking_id}:`, processError)
          failedCount++
          results.push({
            preBookingId: booking.pre_booking_id,
            success: false,
            error: processError.message
          })
        } else if (result?.success) {
          processedCount++
          results.push({
            preBookingId: booking.pre_booking_id,
            success: true,
            bookingId: result.booking_id
          })
        } else {
          failedCount++
          results.push({
            preBookingId: booking.pre_booking_id,
            success: false,
            error: result?.error || 'Unknown error'
          })
        }
      } catch (error) {
        console.error(`[auto-book] Exception processing booking ${booking.pre_booking_id}:`, error)
        failedCount++
        results.push({
          preBookingId: booking.pre_booking_id,
          success: false,
          error: 'Exception during processing'
        })
      }
    }

    console.log(`[auto-book] Cron job completed: ${processedCount} succeeded, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: 'Pre-booking processing cycle completed',
      processed: processedCount,
      failed: failedCount,
      total: readyBookings.length,
      results: results
    })
  } catch (error) {
    console.error('[auto-book] Unexpected error in cron handler:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // For manual triggering and Vercel cron compatibility
  return GET(request)
}
