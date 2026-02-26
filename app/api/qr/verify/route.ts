/**
 * QR Verification API Endpoint
 * Handles QR code scanning and verification
 * POST /api/qr/verify - Verify QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyQRToken, decodeQRTokenWithoutVerification, isTokenExpired } from '@/lib/services/qr-code';
import { markQRAsUsed, getBookingDetails } from '@/lib/services/qr-database';

interface VerifyQRRequest {
  qrToken: string;
  staffId?: string;
}

interface VerifyQRResponse {
  success: boolean;
  message: string;
  bookingDetails?: {
    bookingId: string;
    userId: string;
    status: string;
    movieTitle?: string;
    theatreName?: string;
    showDate: string;
    showTime: string;
    seats: string[];
    totalAmount: number;
  };
  error?: string;
}

/**
 * POST /api/qr/verify
 * Verify QR code and mark as used if valid
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyQRResponse>> {
  try {
    const supabase = await createClient();

    // Get authenticated user (staff member)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Staff authentication required',
        },
        { status: 401 }
      );
    }

    const body: VerifyQRRequest = await request.json();
    const { qrToken, staffId } = body;

    if (!qrToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Request',
          error: 'QR token is required',
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(qrToken)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ticket Expired',
          error: 'QR code has expired (valid for 4 hours after booking)',
        },
        { status: 400 }
      );
    }

    // Verify JWT token
    const verification = verifyQRToken(qrToken);

    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Ticket',
          error: verification.error || 'QR code verification failed',
        },
        { status: 400 }
      );
    }

    const payload = verification.payload;

    // Get booking details from database
    const bookingDetailsResult = await getBookingDetails(payload.bookingId);

    if (bookingDetailsResult.error || !bookingDetailsResult.data) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking Not Found',
          error: bookingDetailsResult.error || 'Booking record not found in database',
        },
        { status: 404 }
      );
    }

    const bookingData = bookingDetailsResult.data;

    // Verify booking status
    if (bookingData.status !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Ticket',
          error: `Booking status is ${bookingData.status}, only confirmed bookings are valid`,
        },
        { status: 400 }
      );
    }

    // Mark QR as used and update database
    const usageResult = await markQRAsUsed(payload.bookingId, staffId || user.id);

    if (!usageResult.success) {
      // Check if the error is "already used"
      if (usageResult.message === 'QR Already Used') {
        return NextResponse.json(
          {
            success: false,
            message: 'QR Already Used',
            error: usageResult.error || 'This ticket has already been scanned',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: usageResult.message || 'Verification Failed',
          error: usageResult.error || 'Could not verify ticket',
        },
        { status: 400 }
      );
    }

    // Successful verification
    return NextResponse.json(
      {
        success: true,
        message: 'QR Verified Successfully',
        bookingDetails: {
          bookingId: payload.bookingId,
          userId: payload.userId,
          status: bookingData.booking_status,
          showDate: payload.showDate,
          showTime: payload.showTime,
          seats: payload.seats,
          totalAmount: bookingData.total_amount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

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

/**
 * GET /api/qr/verify?token=<qrToken>
 * Decode and display QR information without marking as used (preview mode)
 * Useful for manual inspection before scanning
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const qrToken = searchParams.get('token');

    if (!qrToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing QR Token',
          error: 'token parameter is required',
        },
        { status: 400 }
      );
    }

    // Decode token without verification (for display purposes)
    const decoded = decodeQRTokenWithoutVerification(qrToken);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid QR Code',
          error: 'QR code could not be decoded',
        },
        { status: 400 }
      );
    }

    // Check expiration
    const expired = isTokenExpired(qrToken);

    return NextResponse.json(
      {
        success: true,
        message: 'QR Information Retrieved',
        data: {
          bookingId: decoded.bookingId,
          theatreId: decoded.theatreId,
          showDate: decoded.showDate,
          showTime: decoded.showTime,
          seats: decoded.seats,
          expired,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

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
