/**
 * QR Generation API Endpoint
 * Generates QR code for confirmed bookings
 * POST /api/qr/generate - Generate QR for a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBookingQRCode } from '@/lib/services/qr-code';
import { saveBookingQRCode, getBookingDetails } from '@/lib/services/qr-database';

interface GenerateQRRequest {
  bookingId: string;
}

interface GenerateQRResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    qrToken: string;
    qrCodeImage: string; // Base64 PNG
    expiresAt: string;
    expiresInHours: number;
  };
  error?: string;
}

/**
 * POST /api/qr/generate
 * Generate QR code for a confirmed booking
 * Should be called after payment is confirmed and booking is created
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateQRResponse>> {
  try {
    console.log('[QR API] POST request received')
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[QR API] POST: User not authenticated')
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    const body: GenerateQRRequest = await request.json();
    const { bookingId } = body;
    
    console.log('[QR API] POST: Processing QR generation request for booking:', bookingId)

    if (!bookingId) {
      console.warn('[QR API] POST: bookingId is missing')
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Request',
          error: 'bookingId is required',
        },
        { status: 400 }
      );
    }

    // Fetch booking details
    console.log('[QR API] POST: Fetching booking details for:', bookingId)
    const bookingDetailsResult = await getBookingDetails(bookingId);

    if (bookingDetailsResult.error || !bookingDetailsResult.data) {
      console.warn('[QR API] POST: Failed to fetch booking details:', bookingDetailsResult.error)
      return NextResponse.json(
        {
          success: false,
          message: 'Booking Not Found',
          error: bookingDetailsResult.error || 'Could not retrieve booking details',
        },
        { status: 404 }
      );
    }

    const bookingData = bookingDetailsResult.data;
    console.log('[QR API] POST: Booking found, status:', bookingData.status)

    // Verify booking belongs to authenticated user
    if (bookingData.user_id !== user.id) {
      console.warn('[QR API] POST: Booking does not belong to user:', user.id)
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
    if (bookingData.status !== 'confirmed') {
      console.warn('[QR API] POST: Booking not confirmed, status:', bookingData.status)
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Booking Status',
          error: `Cannot generate QR for ${bookingData.status} bookings. Only confirmed bookings can have QR codes.`,
        },
        { status: 400 }
      );
    }

    // Generate QR code
    console.log('[QR API] POST: Generating QR code with seat data:', {
      bookingId,
      seatsCount: bookingData.seats.length,
      theaterId: bookingData.showtime.theater_id,
    })
    
    // Format seat strings as "Row+SeatNumber" (e.g., "A1", "B5")
    const seatStrings = bookingData.seats
      .map((s) => {
        if (s.seat && s.seat.row_label && s.seat.seat_number) {
          return `${s.seat.row_label}${s.seat.seat_number}`
        }
        return s.seat_id // Fallback to seat_id if seat details not available
      })
    
    console.log('[QR API] POST: Formatted seat strings:', seatStrings)
    
    const qrResult = await generateBookingQRCode(
      bookingId,
      bookingData.user_id,
      bookingData.showtime.theater_id,
      bookingData.showtime.show_date,
      bookingData.showtime.show_time,
      seatStrings
    );

    console.log('[QR API] POST: QR code generated, saving to database...')

    // Save QR code to database
    const saveResult = await saveBookingQRCode(
      bookingId,
      bookingData.user_id,
      qrResult.token,
      qrResult.qrDataUrl,
      qrResult.expiresAt
    );

    if (!saveResult.success) {
      console.error('[QR API] POST: Failed to save QR code:', saveResult.error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to Save QR Code',
          error: saveResult.error || 'Could not save QR code to database',
        },
        { status: 500 }
      );
    }

    console.log('[QR API] POST: ✅ QR code generated and saved successfully')

    // Return only the base64 part without data URL prefix for client component
    const base64Image = qrResult.qrDataUrl.startsWith('data:image/png;base64,')
      ? qrResult.qrDataUrl.split(',')[1]
      : qrResult.qrDataUrl

    return NextResponse.json(
      {
        success: true,
        message: 'QR Code Generated Successfully',
        data: {
          bookingId,
          qrToken: qrResult.token,
          qrCodeImage: `data:image/png;base64,${base64Image}`, // Return as data URL for client
          expiresAt: qrResult.expiresAt,
          expiresInHours: 4,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const fullError = error instanceof Error ? error.stack : JSON.stringify(error)
    
    console.error('[QR API] POST: Caught exception:', {
      message: errorMessage,
      stack: fullError,
    })

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

/**
 * GET /api/qr/generate?bookingId=<bookingId>
 * Retrieve existing QR code for a booking
 * Returns the previously generated QR code without regenerating
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[QR API] GET: User not authenticated')
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      console.log('[QR API] GET: bookingId missing')
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Request',
          error: 'bookingId is required',
        },
        { status: 400 }
      );
    }

    console.log('[QR API] GET: Checking for QR code for booking:', bookingId)

    // First, fetch booking details to verify it exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.warn('[QR API] GET: Booking not found:', bookingError?.message)
      return NextResponse.json(
        {
          success: false,
          message: 'Booking Not Found',
          error: 'This booking does not exist or has been deleted',
        },
        { status: 404 }
      );
    }

    // Verify booking belongs to authenticated user
    if (booking.user_id !== user.id) {
      console.warn('[QR API] GET: Booking does not belong to user')
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden',
          error: 'This booking does not belong to your account',
        },
        { status: 403 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      console.warn('[QR API] GET: Booking not confirmed, status:', booking.status)
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Booking Status',
          error: `QR codes can only be generated for confirmed bookings. Your booking status is: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // Now fetch QR code details
    console.log('[QR API] GET: Fetching QR code from database')
    const { data: qrData, error: qrError } = await supabase
      .from('booking_qr_codes')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (qrError) {
      console.log('[QR API] GET: Database error:', qrError.message)
      return NextResponse.json(
        {
          success: false,
          message: 'Database Error',
          error: qrError.message,
        },
        { status: 500 }
      );
    }

    if (!qrData) {
      console.log('[QR API] GET: QR code not found, may still be generating')
      return NextResponse.json(
        {
          success: false,
          message: 'QR Code Generating',
          error: 'QR code is still being generated. Please try again in a moment.',
        },
        { status: 202 } // 202 Accepted - still processing
      );
    }

    console.log('[QR API] GET: QR code found, returning data')

    // Convert base64 back to data URL
    const qrCodeDataUrl = `data:image/png;base64,${qrData.qr_code_image}`;

    return NextResponse.json(
      {
        success: true,
        message: 'QR Code Retrieved Successfully',
        data: {
          bookingId: qrData.booking_id,
          qrToken: qrData.qr_token,
          qrCodeImage: qrCodeDataUrl,
          expiresAt: qrData.qr_expires_at,
          isUsed: qrData.qr_used,
          scannedAt: qrData.qr_scanned_at,
          generatedAt: qrData.qr_generated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[QR API] GET: Server error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        message: 'Server Error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
