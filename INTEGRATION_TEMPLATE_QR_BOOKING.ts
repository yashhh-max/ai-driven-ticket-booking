/**
 * INTEGRATION TEMPLATE: QR Code Generation in Booking/Payment Flow
 * 
 * This file shows how to integrate QR code generation into your existing
 * booking confirmation workflow. Customize and integrate with your actual
 * payment processing endpoint.
 * 
 * Location: Integrate this logic into your app/api/payments/route.ts or equivalent
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateBookingQRCode } from '@/lib/services/qr-code';
import { saveBookingQRCode } from '@/lib/services/qr-database';

/**
 * Example: POST /api/bookings/confirm
 * This is called after successful payment
 */
export async function confirmBookingWithQR(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      bookingId,
      paymentId,
      amount,
      selectedSeats,
      showDate,
      showTime,
      theatreId,
    } = await request.json();

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Verify Payment (with your payment gateway)
    // ═══════════════════════════════════════════════════════════
    
    const verifyPaymentResponse = await fetch('https://your-payment-gateway-api.com/verify', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}` },
      body: JSON.stringify({ paymentId, amount }),
    });

    const paymentData = await verifyPaymentResponse.json();

    if (!paymentData.success) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Update Booking Status to CONFIRMED
    // ═══════════════════════════════════════════════════════════

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: paymentId,
        paid_amount: amount,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select(`
        id,
        user_id,
        showtime:showtimes(
          id,
          movie_id,
          theater_id,
          show_date,
          show_time
        ),
        booked_seats(seat_id)
      `)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: GENERATE QR CODE ← NEW FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════

    let qrData = null;
    
    try {
      // Extract seat IDs from booked_seats
      const seatIds = booking.booked_seats.map((bs: any) => bs.seat_id);

      // Generate QR code (returns token + image)
      const qrGenerationResult = await generateBookingQRCode(
        bookingId,
        booking.user_id,
        booking.showtime.theater_id,
        booking.showtime.show_date,
        booking.showtime.show_time,
        seatIds
      );

      // ═════════════════════════════════════════════════════════
      // STEP 3B: Save QR Code to Database
      // ═════════════════════════════════════════════════════════

      const saveQRResult = await saveBookingQRCode(
        bookingId,
        booking.user_id,
        qrGenerationResult.token,
        qrGenerationResult.qrDataUrl,
        qrGenerationResult.expiresAt
      );

      if (saveQRResult.success) {
        qrData = {
          token: qrGenerationResult.token,
          image: qrGenerationResult.qrDataUrl,
          expiresAt: qrGenerationResult.expiresAt,
        };

        console.log(`✓ QR code generated and saved for booking ${bookingId}`);
      } else {
        // Log error but don't fail the booking confirmation
        console.error(`⚠ Failed to save QR code: ${saveQRResult.error}`);
      }
    } catch (qrError) {
      // QR generation is not critical - booking is confirmed without it
      console.error(`⚠ QR generation failed: ${qrError instanceof Error ? qrError.message : 'Unknown error'}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Send Confirmation Email with QR Code
    // ═══════════════════════════════════════════════════════════

    try {
      const emailResponse = await fetch('/api/send-email-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_confirmation',
          userId: booking.user_id,
          bookingId: bookingId,
          paymentId: paymentId,
          amount: amount,
          qrCodeImage: qrData?.image, // Include QR in email
          expiresAt: qrData?.expiresAt,
          showDetails: {
            date: booking.showtime.show_date,
            time: booking.showtime.show_time,
            seats: seatIds.join(', '),
          },
        }),
      });

      if (!emailResponse.ok) {
        console.warn('⚠ Failed to send confirmation email');
      }
    } catch (emailError) {
      console.error(`⚠ Email notification failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Record Transaction in Audit Log
    // ═══════════════════════════════════════════════════════════

    await supabase
      .from('booking_transactions')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        transaction_type: 'booking_confirmation',
        status: 'success',
        amount: amount,
        payment_id: paymentId,
        qr_generated: qrData !== null,
        metadata: {
          seats: seatIds,
          showDate: booking.showtime.show_date,
          qr_token: qrData?.token, // Store token for reference
        },
        created_at: new Date().toISOString(),
      })
      .single();

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Return Response with QR Code
    // ═══════════════════════════════════════════════════════════

    return NextResponse.json(
      {
        success: true,
        message: 'Booking confirmed successfully',
        data: {
          bookingId: bookingId,
          status: 'confirmed',
          paymentId: paymentId,
          amount: amount,
          confirmedAt: new Date().toISOString(),
          // QR Code Data
          qrCode: qrData
            ? {
                token: qrData.token,
                image: qrData.image, // Base64 PNG or data URL
                expiresAt: qrData.expiresAt,
                expiresInHours: 4,
              }
            : null,
          showDetails: {
            date: booking.showtime.show_date,
            time: booking.showtime.show_time,
            theatre: theatreId,
            seats: seatIds.join(', '),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: `Booking confirmation failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FRONTEND USAGE EXAMPLE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * In your checkout/confirmation page component
 * Example: app/checkout/completion/page.tsx
 */

/*
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface BookingConfirmationData {
  bookingId: string
  status: string
  qrCode?: {
    image: string
    expiresAt: string
    expiresInHours: number
  }
  showDetails: {
    date: string
    time: string
    seats: string
  }
}

export default function BookingConfirmation() {
  const [bookingData, setBookingData] = useState<BookingConfirmationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const confirmBooking = async () => {
      try {
        // Get booking details from query params or local state
        const bookingId = new URLSearchParams(window.location.search).get('bookingId')
        
        // Call the booking confirmation API (which now generates QR)
        const response = await fetch('/api/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            // ... other booking data
          }),
        })

        const result = await response.json()
        
        if (result.success) {
          setBookingData(result.data)
          
          // If QR code was generated, you can:
          // 1. Display it to user
          // 2. Send via email (backend will handle)
          // 3. Show in user's dashboard
          // 4. Offer print/download options
        }
      } catch (error) {
        console.error('Failed to confirm booking:', error)
      } finally {
        setLoading(false)
      }
    }

    confirmBooking()
  }, [])

  if (loading) return <div>Confirming your booking...</div>

  return (
    <div className="booking-confirmation">
      <h1>✓ Booking Confirmed!</h1>
      
      {bookingData && (
        <>
          <div className="booking-details">
            <p>Booking ID: {bookingData.bookingId}</p>
            <p>Date: {bookingData.showDetails.date}</p>
            <p>Time: {bookingData.showDetails.time}</p>
            <p>Seats: {bookingData.showDetails.seats}</p>
          </div>

          {bookingData.qrCode && (
            <div className="qr-section">
              <h2>Your Entry Ticket</h2>
              <img 
                src={bookingData.qrCode.image} 
                alt="Booking QR Code"
                style={{ width: '300px', height: '300px' }}
              />
              <p>Valid for {bookingData.qrCode.expiresInHours} hours</p>
              <Button onClick={() => window.print()}>Print Ticket</Button>
              <Button onClick={() => shareQR(bookingData.qrCode.image)}>
                Share QR
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function shareQR(qrImage: string) {
  // Share via email, SMS, WhatsApp, etc.
  // Implementation depends on your sharing mechanism
}
*/

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KEY POINTS FOR INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. QR Generation Timing:
 *    - Generate ONLY after booking status is set to CONFIRMED
 *    - Must happen AFTER payment is verified
 *    - Before sending confirmation email
 * 
 * 2. Error Handling:
 *    - QR generation failures should NOT block booking confirmation
 *    - Log errors but continue with booking confirmation
 *    - User can regenerate QR later if needed
 * 
 * 3. Data Flow:
 *    Booking Created → Payment → Verify Payment → Confirm Booking 
 *    → Generate QR → Save QR → Send Email → Return Confirmation
 * 
 * 4. Response includes:
 *    - QR token (for verification endpoint)
 *    - QR image (for display)
 *    - Expiration time
 * 
 * 5. Frontend should:
 *    - Display QR code prominently
 *    - Show expiration countdown
 *    - Offer print/share/download options
 *    - Store in user's dashboard/bookings page
 * 
 * 6. Admin/Theatre staff should:
 *    - Have QR scanning interface
 *    - Verify QR codes at entry points
 *    - See booking details upon successful scan
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */
