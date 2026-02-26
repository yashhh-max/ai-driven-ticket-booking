/**
 * Auto-Booking Fallback System
 * 
 * This module handles automatic fallback booking when the primary theatre
 * is unavailable. It tries theatres in priority order sequentially until
 * a booking succeeds or all options are exhausted.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Theatre {
  id: string;
  name: string;
  apiEndpoint: string;
  priority: number; // 1 = highest priority
}

export interface BookingRequest {
  movieId: string;
  showTimeId: string;
  seats: string[]; // Array of seat IDs
  userId: string;
  bookingType?: 'standard' | 'premium';
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: string;
  theatre?: Theatre;
  timestamp?: string;
}

export interface AutoBookingResult {
  success: boolean;
  theatreBooked?: Theatre;
  bookingId?: string;
  message: string;
  failedTheatres: Array<{
    theatre: Theatre;
    error: string;
  }>;
  totalAttemptsCount: number;
}

export enum BookingFailureReason {
  HOUSE_FULL = 'HOUSE_FULL',
  SEATS_UNAVAILABLE = 'SEATS_UNAVAILABLE',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// SINGLE BOOKING ATTEMPT
// ============================================================================

/**
 * Attempt to book tickets at a single theatre via its API endpoint.
 * 
 * @param theatre - Theatre configuration with API endpoint
 * @param bookingRequest - Booking details (movieId, seats, userId, etc.)
 * @param timeoutMs - Timeout for API call in milliseconds (default: 30000)
 * @returns Promise<BookingResponse> - Result of the booking attempt
 */
async function attemptBookingAtTheatre(
  theatre: Theatre,
  bookingRequest: BookingRequest,
  timeoutMs: number = 30000
): Promise<BookingResponse> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    /**
     * Prepare the API request payload
     */
    const payload = {
      ...bookingRequest,
      theatreId: theatre.id,
    };

    /**
     * Make the API call with timeout handling
     */
    const response = await fetch(theatre.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Theatre-ID': theatre.id,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    /**
     * Parse the response
     */
    const data = (await response.json()) as BookingResponse;

    /**
     * Validate response structure
     */
    if (typeof data.success !== 'boolean') {
      return {
        success: false,
        message: `Invalid API response format from ${theatre.name}`,
      };
    }

    /**
     * Return the API response
     */
    return {
      ...data,
      theatre,
    };
  } catch (error) {
    /**
     * Handle different types of errors
     */
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `Booking request timed out at ${theatre.name} after ${timeoutMs}ms`,
        };
      }

      /**
       * Network or API-level errors
       */
      return {
        success: false,
        message: `Failed to book at ${theatre.name}: ${error.message}`,
      };
    }

    return {
      success: false,
      message: `Unknown error occurred while booking at ${theatre.name}`,
    };
  }
}

// ============================================================================
// AUTO-BOOKING WITH FALLBACK
// ============================================================================

/**
 * Automatically book tickets with fallback across multiple theatres.
 * 
 * Tries to book at each theatre in priority order (1 = highest).
 * Stops and returns success as soon as one theatre succeeds.
 * If all theatres fail, returns the complete failure history.
 * 
 * @param theatres - Array of Theatre objects sorted by priority
 * @param bookingRequest - Booking details to attempt
 * @param options - Optional configuration
 * @returns Promise<AutoBookingResult> - Result with success status and theatre info
 * 
 * @example
 * ```typescript
 * const theatres = [
 *   { id: '1', name: 'Theatre A', apiEndpoint: 'https://api.theatre-a.com/book', priority: 1 },
 *   { id: '2', name: 'Theatre B', apiEndpoint: 'https://api.theatre-b.com/book', priority: 2 },
 *   { id: '3', name: 'Theatre C', apiEndpoint: 'https://api.theatre-c.com/book', priority: 3 },
 * ];
 * 
 * const result = await autoBookWithFallback(theatres, {
 *   movieId: 'mov123',
 *   showTimeId: 'show456',
 *   seats: ['A1', 'A2'],
 *   userId: 'user789',
 * });
 * 
 * if (result.success) {
 *   console.log(`Booked at: ${result.theatreBooked?.name}`);
 * } else {
 *   console.log('All theatres failed');
 * }
 * ```
 */
export async function autoBookWithFallback(
  theatres: Theatre[],
  bookingRequest: BookingRequest,
  options?: {
    timeoutPerTheatreMs?: number;
    stopOnFirstSuccess?: boolean;
  }
): Promise<AutoBookingResult> {
  /**
   * Validate inputs
   */
  if (!theatres || theatres.length === 0) {
    return {
      success: false,
      message: 'No theatres provided for booking',
      failedTheatres: [],
      totalAttemptsCount: 0,
    };
  }

  /**
   * Sort theatres by priority (ascending)
   */
  const sortedTheatres = [...theatres].sort((a, b) => a.priority - b.priority);

  /**
   * Configuration
   */
  const timeoutPerTheatre = options?.timeoutPerTheatreMs ?? 30000;
  const stopOnFirstSuccess = options?.stopOnFirstSuccess ?? true;

  /**
   * Track failed attempts
   */
  const failedTheatres: AutoBookingResult['failedTheatres'] = [];
  let attemptCount = 0;

  /**
   * Try each theatre in priority order
   */
  for (const theatre of sortedTheatres) {
    attemptCount++;

    /**
     * Log booking attempt
     */
    console.log(
      `[AutoBook] Attempt ${attemptCount}/${sortedTheatres.length}: Trying ${theatre.name} (Priority: ${theatre.priority})`
    );

    /**
     * Attempt booking at this theatre
     */
    const bookingResponse = await attemptBookingAtTheatre(
      theatre,
      bookingRequest,
      timeoutPerTheatre
    );

    /**
     * Success case: Return immediately
     */
    if (bookingResponse.success && stopOnFirstSuccess) {
      return {
        success: true,
        theatreBooked: theatre,
        bookingId: bookingResponse.bookingId,
        message: `Successfully booked at ${theatre.name}`,
        failedTheatres,
        totalAttemptsCount: attemptCount,
      };
    }

    /**
     * Failure case: Track and continue to next theatre
     */
    console.warn(
      `[AutoBook] Failed at ${theatre.name}: ${bookingResponse.message}`
    );

    failedTheatres.push({
      theatre,
      error: bookingResponse.message,
    });
  }

  /**
   * All theatres failed
   */
  return {
    success: false,
    message: `Booking failed at all ${sortedTheatres.length} theatres`,
    failedTheatres,
    totalAttemptsCount: attemptCount,
  };
}

// ============================================================================
// ALTERNATIVE: PARALLEL BOOKING ATTEMPTS WITH RACE
// ============================================================================

/**
 * Alternative: Attempt booking at all theatres in parallel and return
 * the first successful result. Useful for performance when theatres
 * have independent APIs.
 * 
 * @param theatres - Array of Theatre objects
 * @param bookingRequest - Booking details
 * @param options - Optional configuration
 * @returns Promise<AutoBookingResult> - Result from first successful theatre
 * 
 * WARNING: This may result in multiple booking attempts being charged.
 * Use sequential approach (autoBookWithFallback) for production.
 */
export async function autoBookWithRace(
  theatres: Theatre[],
  bookingRequest: BookingRequest,
  options?: {
    timeoutPerTheatreMs?: number;
  }
): Promise<AutoBookingResult> {
  if (!theatres || theatres.length === 0) {
    return {
      success: false,
      message: 'No theatres provided for booking',
      failedTheatres: [],
      totalAttemptsCount: 0,
    };
  }

  const timeoutPerTheatre = options?.timeoutPerTheatreMs ?? 30000;
  const failedTheatres: AutoBookingResult['failedTheatres'] = [];

  /**
   * Create array of promise chains that track both success and failure
   */
  const bookingPromises = theatres.map(async (theatre) => {
    const response = await attemptBookingAtTheatre(
      theatre,
      bookingRequest,
      timeoutPerTheatre
    );

    /**
     * If failed, track it and throw to trigger next attempt
     */
    if (!response.success) {
      failedTheatres.push({
        theatre,
        error: response.message,
      });
      throw new Error(response.message);
    }

    /**
     * Return successful result
     */
    return {
      theatre,
      response,
    };
  });

  /**
   * Wait for first successful booking
   */
  try {
    const winner = await Promise.race(bookingPromises);

    return {
      success: true,
      theatreBooked: winner.theatre,
      bookingId: winner.response.bookingId,
      message: `Successfully booked at ${winner.theatre.name}`,
      failedTheatres,
      totalAttemptsCount: theatres.length,
    };
  } catch {
    /**
     * All failed
     */
    return {
      success: false,
      message: `Booking failed at all ${theatres.length} theatres`,
      failedTheatres,
      totalAttemptsCount: theatres.length,
    };
  }
}

// ============================================================================
// UTILITY: USER PREFERENCE MANAGEMENT
// ============================================================================

/**
 * Store user's preferred theatre list in a persistent way.
 * This would typically be saved to database or localStorage.
 */
export interface UserTheatrePreferences {
  userId: string;
  preferredTheatres: Theatre[];
  lastUpdated: string;
}

/**
 * Get user's theatre preferences formatted for auto-booking.
 * This would typically fetch from database or localStorage.
 */
export async function getUserTheatrePreferences(
  userId: string
): Promise<Theatre[]> {
  /**
   * Example implementation - replace with actual data source
   */
  try {
    const response = await fetch(`/api/user/${userId}/theatre-preferences`);
    const data = (await response.json()) as UserTheatrePreferences;
    return data.preferredTheatres || [];
  } catch (error) {
    console.error('Failed to fetch user theatre preferences:', error);
    return [];
  }
}

/**
 * Save user's theatre preferences.
 */
export async function saveUserTheatrePreferences(
  userId: string,
  theatres: Theatre[]
): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/${userId}/theatre-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredTheatres: theatres,
        lastUpdated: new Date().toISOString(),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save user theatre preferences:', error);
    return false;
  }
}
