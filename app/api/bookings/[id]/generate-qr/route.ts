/**
 * QR Code Generation for Bookings
 * Direct generation endpoint for confirmed bookings
 * Called after booking is confirmed (either through payment or checkout)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBookingQRCode } from '@/lib/services/qr-code';
import { saveBookingQRCode } from '@/lib/services/qr-database';

interface GenerateQRRequest {
  bookingId: string;
}

interface GenerateQRResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    qrToken: string;
    qrCodeImage: string;
    expiresAt: string;
  };
  error?: string;
}

/**
 * POST /api/bookings/[id]/generate-qr
 * Generate QR code for a booking that's already confirmed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GenerateQRResponse>> {
  try {
    const { id: bookingId } = await params;
    const supabase = await createClient();

    console.log('[QR Generate] POST request for booking:', bookingId);

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[QR Generate] User not authenticated');
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    if (!bookingId) {
      console.warn('[QR Generate] No booking ID provided');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Request',
          error: 'bookingId is required',
        },
        { status: 400 }
      );
    }

    console.log('[QR Generate] Fetching booking details...');

    // Fetch booking with full details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        status,
        showtime:showtimes(
          id,
          theater_id,
          show_date,
          show_time
        ),
        booked_seats(
          seat_id,
          seat:seats(row_label, seat_number)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.warn('[QR Generate] Booking not found:', bookingError?.message);
      return NextResponse.json(
        {
          success: false,
          message: 'Booking Not Found',
          error: bookingError?.message || 'Could not retrieve booking details',
        },
        { status: 404 }
      );
    }

    console.log('[QR Generate] Booking found, status:', booking.status);

    // Verify booking belongs to user
    if (booking.user_id !== user.id) {
      console.warn('[QR Generate] Booking does not belong to user');
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden',
          error: 'This booking does not belong to your account',
        },
        { status: 403 }
      );
    }

    // Verify booking is confirmed
    if (booking.status !== 'confirmed') {
      console.warn('[QR Generate] Booking not confirmed, status:', booking.status);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Booking Status',
          error: `Cannot generate QR for ${booking.status} bookings. Only confirmed bookings can have QR codes`,
        },
        { status: 400 }
      );
    }

    console.log('[QR Generate] Generating QR code...');

    // Format seat strings
    const seatStrings = booking.booked_seats
      ?.map((bs: any) => {
        if (bs.seat && bs.seat.row_label && bs.seat.seat_number) {
          return `${bs.seat.row_label}${bs.seat.seat_number}`;
        }
        return bs.seat_id;
      }) || [];

    console.log('[QR Generate] Seat strings:', seatStrings);

    // Generate QR code
    const qrResult = await generateBookingQRCode(
      booking.id,
      booking.user_id,
      booking.showtime?.theater_id || '',
      booking.showtime?.show_date || '',
      booking.showtime?.show_time || '',
      seatStrings
    );

    console.log('[QR Generate] QR code generated, saving to database...');

    // Save to database
    const saveResult = await saveBookingQRCode(
      booking.id,
      booking.user_id,
      qrResult.token,
      qrResult.qrDataUrl,
      qrResult.expiresAt
    );

    if (!saveResult.success) {
      console.error('[QR Generate] Failed to save QR code:', saveResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to Save QR Code',
          error: saveResult.error || 'Could not save QR code to database',
        },
        { status: 500 }
      );
    }

    console.log('[QR Generate] ✅ QR code generated and saved successfully');

    // Extract base64 from data URL
    const base64Image = qrResult.qrDataUrl.startsWith('data:image/png;base64,')
      ? qrResult.qrDataUrl.split(',')[1]
      : qrResult.qrDataUrl;

    return NextResponse.json(
      {
        success: true,
        message: 'QR Code Generated Successfully',
        data: {
          bookingId: booking.id,
          qrToken: qrResult.token,
          qrCodeImage: `data:image/png;base64,${base64Image}`,
          expiresAt: qrResult.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[QR Generate] Server error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Server Error',
        error: `Failed to generate QR code: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
