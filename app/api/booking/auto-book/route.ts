/**
 * API Route: POST /api/booking/auto-book
 * 
 * Handles auto-booking with fallback across multiple theatres
 * The user selects 3 preferred theatres and the system tries them
 * in priority order until one succeeds or all fail.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  autoBookWithFallback,
  getUserTheatrePreferences,
  Theatre,
  BookingRequest,
  AutoBookingResult,
} from '@/lib/booking/auto-booking';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface AutoBookingRequestPayload {
  movieId: string;
  showTimeId: string;
  seats: string[];
  theatrePreferences?: Theatre[]; // Optional: if user preferences already fetched
}

interface AutoBookingResponsePayload {
  success: boolean;
  data?: {
    bookingId?: string;
    theatreBooked?: Theatre;
    totalAttemptsCount: number;
  };
  error?: {
    message: string;
    failedTheatres?: Array<{
      theatreName: string;
      theatreId: string;
      error: string;
    }>;
  };
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateAutoBookingRequest(
  body: unknown
): {
  valid: boolean;
  errors?: string[];
  data?: AutoBookingRequestPayload;
} {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: ['Request body must be a JSON object'],
    };
  }

  const payload = body as Record<string, unknown>;

  /**
   * Validate required fields
   */
  const errors: string[] = [];

  if (!payload.movieId || typeof payload.movieId !== 'string') {
    errors.push('movieId is required and must be a string');
  }

  if (!payload.showTimeId || typeof payload.showTimeId !== 'string') {
    errors.push('showTimeId is required and must be a string');
  }

  if (!Array.isArray(payload.seats) || payload.seats.length === 0) {
    errors.push('seats must be a non-empty array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: payload as AutoBookingRequestPayload,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    /**
     * Extract request body
     */
    const body = await request.json();

    /**
     * Validate request
     */
    const validation = validateAutoBookingRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request',
            details: validation.errors,
          },
        } as AutoBookingResponsePayload,
        { status: 400 }
      );
    }

    const requestData = validation.data!;

    /**
     * Extract user info from headers or session
     * In production, get from NextAuth or similar auth middleware
     */
    const userId = request.headers.get('x-user-id') || 'anonymous';

    console.log(`[AutoBook API] Processing booking for user: ${userId}`);
    console.log(
      `[AutoBook API] Movie: ${requestData.movieId}, Showtime: ${requestData.showTimeId}`
    );

    /**
     * Step 1: Get user's theatre preferences
     */
    let theatres = requestData.theatrePreferences;

    if (!theatres || theatres.length === 0) {
      console.log(
        `[AutoBook API] Fetching theatre preferences for user: ${userId}`
      );
      theatres = await getUserTheatrePreferences(userId);
    }

    /**
     * Validate that user has theatre preferences
     */
    if (!theatres || theatres.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'No preferred theatres configured. Please select your preferred theatres first.',
          },
        } as AutoBookingResponsePayload,
        { status: 400 }
      );
    }

    console.log(
      `[AutoBook API] User has ${theatres.length} preferred theatre(s)`
    );

    /**
     * Step 2: Build booking request
     */
    const bookingRequest: BookingRequest = {
      movieId: requestData.movieId,
      showTimeId: requestData.showTimeId,
      seats: requestData.seats,
      userId,
      bookingType: 'standard',
    };

    /**
     * Step 3: Execute auto-booking with fallback
     */
    console.log(`[AutoBook API] Starting auto-booking process...`);
    const result = await autoBookWithFallback(theatres, bookingRequest, {
      timeoutPerTheatreMs: 30000,
      stopOnFirstSuccess: true,
    });

    /**
     * Step 4: Format and return response
     */
    if (result.success && result.theatreBooked && result.bookingId) {
      console.log(
        `[AutoBook API] ✅ SUCCESS at ${result.theatreBooked.name}`
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            bookingId: result.bookingId,
            theatreBooked: result.theatreBooked,
            totalAttemptsCount: result.totalAttemptsCount,
          },
        } as AutoBookingResponsePayload,
        { status: 200 }
      );
    } else {
      /**
       * All theatres failed
       */
      console.warn(
        `[AutoBook API] ❌ FAILED: All ${result.totalAttemptsCount} attempts failed`
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            message: result.message,
            failedTheatres: result.failedTheatres.map(({ theatre, error }) => ({
              theatreName: theatre.name,
              theatreId: theatre.id,
              error,
            })),
          },
        } as AutoBookingResponsePayload,
        { status: 409 } // Conflict status for booking unavailable
      );
    }
  } catch (error) {
    /**
     * Handle unexpected errors
     */
    console.error('[AutoBook API] Unexpected error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: {
          message: `Server error: ${errorMessage}`,
        },
      } as AutoBookingResponsePayload,
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONAL: GET ENDPOINT FOR TESTING
// ============================================================================

/**
 * GET endpoint for health check and documentation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      endpoint: '/api/booking/auto-book',
      method: 'POST',
      description:
        'Auto-book with fallback across multiple theatres in priority order',
      payload: {
        movieId: 'string (required)',
        showTimeId: 'string (required)',
        seats: ['string array (required)'],
        theatrePreferences:
          'Theatre[] (optional - if not provided, fetches from user profile)',
      },
      response: {
        success: 'boolean',
        data: {
          bookingId: 'string',
          theatreBooked: 'Theatre object',
          totalAttemptsCount: 'number',
        },
        error: {
          message: 'string',
          failedTheatres: [
            {
              theatreName: 'string',
              theatreId: 'string',
              error: 'string',
            },
          ],
        },
      },
      example: {
        request: {
          movieId: 'mov-avengers-2024',
          showTimeId: 'show-2024-02-10-19-30',
          seats: ['A1', 'A2', 'A3'],
        },
        successResponse: {
          success: true,
          data: {
            bookingId: 'book-xyz123',
            theatreBooked: {
              id: 'theatre-001',
              name: 'Theatre A',
              apiEndpoint: 'https://api.theatre-a.com/book',
              priority: 1,
            },
            totalAttemptsCount: 1,
          },
        },
        failureResponse: {
          success: false,
          error: {
            message:
              'Booking failed at all 3 theatres',
            failedTheatres: [
              {
                theatreName: 'Theatre A',
                theatreId: 'theatre-001',
                error: 'House is full',
              },
              {
                theatreName: 'Theatre B',
                theatreId: 'theatre-002',
                error: 'Selected seats unavailable',
              },
              {
                theatreName: 'Theatre C',
                theatreId: 'theatre-003',
                error: 'API timeout',
              },
            ],
          },
        },
      },
    },
    { status: 200 }
  );
}
