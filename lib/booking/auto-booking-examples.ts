/**
 * Example: Using the Auto-Booking Fallback System
 * 
 * This demonstrates how to integrate the auto-booking feature
 * into your Next.js API routes and components.
 */

import {
  autoBookWithFallback,
  getUserTheatrePreferences,
  Theatre,
  BookingRequest,
  AutoBookingResult,
} from '@/lib/booking/auto-booking';

// ============================================================================
// EXAMPLE 1: API ROUTE HANDLER
// ============================================================================

/**
 * API Route: POST /api/booking/auto-book
 * 
 * This endpoint handles auto-booking requests with fallback logic.
 * The user selects their preferred theatres, and the system tries
 * to book at each one in priority order.
 */
export async function handleAutoBookingRequest(
  req: {
    userId: string;
    movieId: string;
    showTimeId: string;
    seats: string[];
    theatrePreferences?: Theatre[]; // User's preferred theatres or fetched from DB
  },
): Promise<AutoBookingResult> {
  const { userId, movieId, showTimeId, seats, theatrePreferences } = req;

  /**
   * Step 1: Get user's theatre preferences
   * If not provided, fetch from user profile/settings
   */
  let theatres = theatrePreferences;

  if (!theatres || theatres.length === 0) {
    theatres = await getUserTheatrePreferences(userId);
  }

  /**
   * Validate that user has selected theatres
   */
  if (!theatres || theatres.length === 0) {
    return {
      success: false,
      message: 'No preferred theatres configured for this user',
      failedTheatres: [],
      totalAttemptsCount: 0,
    };
  }

  /**
   * Step 2: Build the booking request
   */
  const bookingRequest: BookingRequest = {
    movieId,
    showTimeId,
    seats,
    userId,
    bookingType: 'standard',
  };

  /**
   * Step 3: Attempt booking with fallback
   */
  console.log(`[AutoBook] Starting booking for user ${userId}`);
  console.log(
    `[AutoBook] Selected theatres: ${theatres.map(t => t.name).join(' -> ')}`
  );

  const result = await autoBookWithFallback(theatres, bookingRequest, {
    timeoutPerTheatreMs: 30000,
    stopOnFirstSuccess: true,
  });

  /**
   * Log the result
   */
  if (result.success) {
    console.log(
      `[AutoBook] ✅ SUCCESS: Booked at ${result.theatreBooked?.name}`
    );
  } else {
    console.warn(
      `[AutoBook] ❌ FAILED: All ${result.totalAttemptsCount} attempts failed`
    );
    result.failedTheatres.forEach(({ theatre, error }) => {
      console.warn(`  - ${theatre.name}: ${error}`);
    });
  }

  return result;
}

// ============================================================================
// EXAMPLE 2: USAGE IN COMPONENT / PAGE
// ============================================================================

/**
 * Example React component that uses auto-booking
 */
export function useAutoBooking() {
  const bookWithFallback = async (
    movieId: string,
    showTimeId: string,
    selectedSeats: string[],
    userTheatrePreferences: Theatre[]
  ) => {
    try {
      /**
       * Call the auto-booking API endpoint
       */
      const response = await fetch('/api/booking/auto-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          showTimeId,
          seats: selectedSeats,
          theatrePreferences: userTheatrePreferences,
        }),
      });

      const result: AutoBookingResult = await response.json();

      if (result.success) {
        return {
          success: true,
          message: `Booking confirmed at ${result.theatreBooked?.name}!`,
          bookingId: result.bookingId,
          theatre: result.theatreBooked,
        };
      } else {
        /**
         * Show user which theatres were tried and failed
         */
        const failureDetails = result.failedTheatres
          .map(({ theatre, error }) => `${theatre.name}: ${error}`)
          .join('\n');

        return {
          success: false,
          message: `Booking failed at all selected theatres:\n${failureDetails}`,
          failedTheatres: result.failedTheatres,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error during booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  return { bookWithFallback };
}

// ============================================================================
// EXAMPLE 3: MOCK TEST DATA & SCENARIOS
// ============================================================================

/**
 * Mock theatres for testing
 */
export const MOCK_THEATRES: Theatre[] = [
  {
    id: 'theatre-001',
    name: 'Theatre A - Premium Cinema',
    apiEndpoint: 'https://api.theatre-a.com/v1/bookings',
    priority: 1,
  },
  {
    id: 'theatre-002',
    name: 'Theatre B - Central Mall',
    apiEndpoint: 'https://api.theatre-b.com/v1/bookings',
    priority: 2,
  },
  {
    id: 'theatre-003',
    name: 'Theatre C - Downtown',
    apiEndpoint: 'https://api.theatre-c.com/v1/bookings',
    priority: 3,
  },
];

/**
 * Mock booking request for testing
 */
export const MOCK_BOOKING_REQUEST: BookingRequest = {
  movieId: 'mov-avengers-2024',
  showTimeId: 'show-2024-02-10-19-30',
  seats: ['A1', 'A2', 'A3'],
  userId: 'user-12345',
  bookingType: 'premium',
};

/**
 * Example: How to use in tests
 * 
 * ```typescript
 * import { autoBookWithFallback } from '@/lib/booking/auto-booking';
 * import { MOCK_THEATRES, MOCK_BOOKING_REQUEST } from './examples';
 * 
 * describe('Auto-Booking Fallback', () => {
 *   it('should book at Theatre A if available', async () => {
 *     const result = await autoBookWithFallback(
 *       MOCK_THEATRES,
 *       MOCK_BOOKING_REQUEST
 *     );
 *     expect(result.success).toBe(true);
 *     expect(result.theatreBooked?.name).toBe('Theatre A - Premium Cinema');
 *   });
 * 
 *   it('should fallback to Theatre B when A fails', async () => {
 *     const result = await autoBookWithFallback(
 *       MOCK_THEATRES,
 *       MOCK_BOOKING_REQUEST
 *     );
 *     if (result.success) {
 *       expect(result.theatreBooked?.priority).toBeGreaterThan(1);
 *     }
 *   });
 * });
 * ```
 */

// ============================================================================
// EXAMPLE 4: ERROR HANDLING & USER FEEDBACK
// ============================================================================

/**
 * Parse auto-booking result and provide user-friendly feedback
 */
export function formatAutoBookingError(result: AutoBookingResult): {
  title: string;
  message: string;
  suggestions: string[];
} {
  if (result.success) {
    return {
      title: 'Booking Successful',
      message: `Your tickets have been booked at ${result.theatreBooked?.name}`,
      suggestions: [],
    };
  }

  /**
   * Check if all theatres had the same type of error
   */
  const allSeatErrors = result.failedTheatres.every(({ error }) =>
    error.includes('OUT_OF_SEATS')
  );
  const allNetworkErrors = result.failedTheatres.every(({ error }) =>
    error.includes('NETWORK_ERROR')
  );

  if (allSeatErrors) {
    return {
      title: 'No Seats Available',
      message:
        'Unfortunately, your selected seats are not available at any of your preferred theatres.',
      suggestions: [
        'Try selecting different seats',
        'Choose alternative showtimes',
        'Add more theatres to your preferences',
      ],
    };
  }

  if (allNetworkErrors) {
    return {
      title: 'Temporary Service Issue',
      message:
        'We are experiencing technical difficulties. Please try again in a few moments.',
      suggestions: ['Refresh the page', 'Try again in 2-3 minutes'],
    };
  }

  return {
    title: 'Booking Failed',
    message:
      'We were unable to complete your booking at any of your preferred theatres.',
    suggestions: [
      `Tried ${result.totalAttemptsCount} theatre(s)`,
      'Select different seats or time',
      'Update your theatre preferences',
    ],
  };
}

// ============================================================================
// EXAMPLE 5: SCALING FOR MORE THEATRES
// ============================================================================

/**
 * The system is designed to be scalable. You can add any number of theatres:
 */
export const EXPANDED_THEATRE_LIST: Theatre[] = [
  {
    id: 'theatre-001',
    name: 'Theatre A',
    apiEndpoint: 'https://api-1.theatre.com/book',
    priority: 1,
  },
  {
    id: 'theatre-002',
    name: 'Theatre B',
    apiEndpoint: 'https://api-2.theatre.com/book',
    priority: 2,
  },
  {
    id: 'theatre-003',
    name: 'Theatre C',
    apiEndpoint: 'https://api-3.theatre.com/book',
    priority: 3,
  },
  {
    id: 'theatre-004',
    name: 'Theatre D',
    apiEndpoint: 'https://api-4.theatre.com/book',
    priority: 4,
  },
  {
    id: 'theatre-005',
    name: 'Theatre E',
    apiEndpoint: 'https://api-5.theatre.com/book',
    priority: 5,
  },
];

/**
 * The auto-booking function will automatically try all theatres
 * in priority order. No code changes needed!
 */
