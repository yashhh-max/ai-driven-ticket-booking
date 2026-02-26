/**
 * React Component: Auto-Booking Integration
 * 
 * Complete example showing how to integrate auto-booking into your UI
 * including theatre selection and booking flow.
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Theatre,
  BookingRequest,
  AutoBookingResult,
} from '@/lib/booking/auto-booking';

// ============================================================================
// TYPES
// ============================================================================

interface AutoBookingState {
  isLoading: boolean;
  error: string | null;
  selectedTheatres: Theatre[];
  bookingResult?: AutoBookingResult;
}

// ============================================================================
// HOOK: useAutoBookingFlow
// ============================================================================

export function useAutoBookingFlow() {
  const [state, setState] = useState<AutoBookingState>({
    isLoading: false,
    error: null,
    selectedTheatres: [],
  });

  /**
   * Add theatre to preferences (max 3)
   */
  const addTheatrePreference = useCallback((theatre: Theatre) => {
    setState((prev) => {
      const updated = [...prev.selectedTheatres, theatre];

      // Keep only 3 theatres
      if (updated.length > 3) {
        updated.shift();
      }

      // Update priorities based on position
      return {
        ...prev,
        selectedTheatres: updated.map((t, idx) => ({
          ...t,
          priority: idx + 1,
        })),
      };
    });
  }, []);

  /**
   * Remove theatre from preferences
   */
  const removeTheatrePreference = useCallback((theatreId: string) => {
    setState((prev) => {
      const updated = prev.selectedTheatres.filter((t) => t.id !== theatreId);

      // Recalculate priorities
      return {
        ...prev,
        selectedTheatres: updated.map((t, idx) => ({
          ...t,
          priority: idx + 1,
        })),
      };
    });
  }, []);

  /**
   * Perform auto-booking
   */
  const performAutoBooking = useCallback(
    async (
      movieId: string,
      showTimeId: string,
      selectedSeats: string[]
    ) => {
      // Validate
      if (state.selectedTheatres.length === 0) {
        setState((prev) => ({
          ...prev,
          error: 'Please select at least one theatre',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        bookingResult: undefined,
      }));

      try {
        // Call API endpoint
        const response = await fetch('/api/booking/auto-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId,
            showTimeId,
            seats: selectedSeats,
            theatrePreferences: state.selectedTheatres,
          }),
        });

        const result = (await response.json()) as {
          success: boolean;
          data?: AutoBookingResult;
          error?: { message: string };
        };

        if (!response.ok) {
          throw new Error(result.error?.message || 'Booking failed');
        }

        setState((prev) => ({
          ...prev,
          bookingResult: result.data,
          error: null,
        }));

        return result.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred';

        setState((prev) => ({
          ...prev,
          error: message,
        }));

        return null;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [state.selectedTheatres]
  );

  /**
   * Reset booking state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      selectedTheatres: state.selectedTheatres, // Keep selections
      bookingResult: undefined,
    });
  }, [state.selectedTheatres]);

  return {
    ...state,
    addTheatrePreference,
    removeTheatrePreference,
    performAutoBooking,
    reset,
  };
}

// ============================================================================
// COMPONENT: TheatrePreferencesSelector
// ============================================================================

interface TheatrePreferencesSelectorProps {
  availableTheatres: Theatre[];
  selectedTheatres: Theatre[];
  maxTheatres?: number;
  onAddTheatre: (theatre: Theatre) => void;
  onRemoveTheatre: (theatreId: string) => void;
}

export function TheatrePreferencesSelector({
  availableTheatres,
  selectedTheatres,
  maxTheatres = 3,
  onAddTheatre,
  onRemoveTheatre,
}: TheatrePreferencesSelectorProps) {
  const unselectedTheatres = availableTheatres.filter(
    (t) => !selectedTheatres.some((s) => s.id === t.id)
  );

  return (
    <div className="theatre-selector">
      <div className="selector-header">
        <h3>Select Your Preferred Theatres</h3>
        <p className="text-sm text-gray-600">
          Up to {maxTheatres} theatres in priority order
        </p>
      </div>

      {/* Selected Theatres */}
      {selectedTheatres.length > 0 && (
        <div className="selected-theatres">
          <h4 className="font-semibold mb-3">Your Preferences</h4>
          <div className="space-y-2">
            {selectedTheatres.map((theatre, idx) => (
              <div
                key={theatre.id}
                className="selected-theatre-item flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
              >
                <div>
                  <span className="priority-badge font-bold bg-blue-600 text-white px-2 py-1 rounded-full mr-3">
                    {idx + 1}
                  </span>
                  <span className="theatre-name">{theatre.name}</span>
                </div>
                <button
                  onClick={() => onRemoveTheatre(theatre.id)}
                  className="remove-btn text-red-600 hover:text-red-800"
                  aria-label={`Remove ${theatre.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Theatres to Add */}
      {selectedTheatres.length < maxTheatres && unselectedTheatres.length > 0 && (
        <div className="available-theatres mt-6">
          <h4 className="font-semibold mb-3">Available Theatres</h4>
          <div className="grid grid-cols-1 gap-2">
            {unselectedTheatres.map((theatre) => (
              <button
                key={theatre.id}
                onClick={() => onAddTheatre(theatre)}
                className="theatre-option p-3 border border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-left transition"
              >
                <p className="font-medium">{theatre.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {unselectedTheatres.length === 0 && selectedTheatres.length === 0 && (
        <div className="empty-state text-center py-6 text-gray-500">
          <p>No theatres available</p>
        </div>
      )}

      {/* Max Selected */}
      {selectedTheatres.length === maxTheatres && (
        <p className="text-sm text-gray-600 mt-3">
          ℹ️ Maximum {maxTheatres} theatres selected. Remove one to add another.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: BookingProgressIndicator
// ============================================================================

interface BookingProgressIndicatorProps {
  selectedTheatres: Theatre[];
  isLoading: boolean;
  result?: AutoBookingResult;
}

export function BookingProgressIndicator({
  selectedTheatres,
  isLoading,
  result,
}: BookingProgressIndicatorProps) {
  return (
    <div className="progress-indicator">
      <h4 className="font-semibold mb-4">Booking Progress</h4>

      <div className="space-y-2">
        {selectedTheatres.map((theatre) => {
          let status: 'pending' | 'attempting' | 'success' | 'failed' =
            'pending';
          let errorMessage = '';

          if (result) {
            if (result.success && result.theatreBooked?.id === theatre.id) {
              status = 'success';
            } else {
              const failedTheatre = result.failedTheatres.find(
                (f) => f.theatre.id === theatre.id
              );
              if (failedTheatre) {
                status = 'failed';
                errorMessage = failedTheatre.error;
              }
            }
          } else if (isLoading) {
            status = 'attempting';
          }

          return (
            <div
              key={theatre.id}
              className={`progress-item p-3 rounded border ${
                status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : status === 'attempting'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="theatre-name font-medium">
                    {theatre.name}
                  </span>
                  {errorMessage && (
                    <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                  )}
                </div>

                <span
                  className={`status-icon ${
                    status === 'success'
                      ? 'text-green-600'
                      : status === 'failed'
                        ? 'text-red-600'
                        : status === 'attempting'
                          ? 'text-yellow-600 animate-spin'
                          : 'text-gray-400'
                  }`}
                >
                  {status === 'success' && '✓'}
                  {status === 'failed' && '✕'}
                  {status === 'attempting' && '⟳'}
                  {status === 'pending' && '○'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: BookingResult
// ============================================================================

interface BookingResultProps {
  result: AutoBookingResult;
  onBookAnother: () => void;
}

export function BookingResult({
  result,
  onBookAnother,
}: BookingResultProps) {
  if (result.success) {
    return (
      <div className="booking-result success bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <span className="text-4xl mr-4">✓</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Booking Successful!
            </h3>
            <p className="text-green-700 mb-4">
              Your tickets have been booked at{' '}
              <strong>{result.theatreBooked?.name}</strong>
            </p>
            <div className="bg-white p-3 rounded border border-green-200 mb-4">
              <p className="text-sm font-mono">
                <strong>Booking ID:</strong> {result.bookingId}
              </p>
            </div>
            <p className="text-sm text-green-600">
              Booking completed in {result.totalAttemptsCount} attempt(s)
            </p>
          </div>
        </div>

        <button
          onClick={onBookAnother}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Book Another Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="booking-result failure bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <span className="text-4xl mr-4">✕</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-800 mb-2">
            Booking Failed
          </h3>
          <p className="text-red-700 mb-4">{result.message}</p>

          {result.failedTheatres.length > 0 && (
            <div className="bg-white p-3 rounded border border-red-200 mb-4">
              <p className="text-sm font-semibold mb-2">Failed Theatres:</p>
              <ul className="text-sm space-y-1">
                {result.failedTheatres.map(({ theatre, error }) => (
                  <li key={theatre.id}>
                    <strong>{theatre.name}:</strong> {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>💡 Suggestions:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Try selecting different seats</li>
              <li>Choose a different showtime</li>
              <li>Update your theatre preferences</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBookAnother}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
        <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
          Contact Support
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN: Complete Booking Page Component
// ============================================================================

interface CompleteAutoBookingPageProps {
  availableTheatres: Theatre[];
  movieId: string;
  showTimeId: string;
  selectedSeats: string[];
}

export function CompleteAutoBookingPage({
  availableTheatres,
  movieId,
  showTimeId,
  selectedSeats,
}: CompleteAutoBookingPageProps) {
  const {
    isLoading,
    error,
    selectedTheatres,
    bookingResult,
    addTheatrePreference,
    removeTheatrePreference,
    performAutoBooking,
    reset,
  } = useAutoBookingFlow();

  const handleBooking = async () => {
    await performAutoBooking(movieId, showTimeId, selectedSeats);
  };

  const handleBookAnother = () => {
    reset();
  };

  // Success state - show confirmation
  if (bookingResult?.success) {
    return (
      <div className="auto-booking-page max-w-2xl mx-auto p-6">
        <BookingResult result={bookingResult} onBookAnother={handleBookAnother} />
      </div>
    );
  }

  // Failure state - show result with retry option
  if (bookingResult && !bookingResult.success) {
    return (
      <div className="auto-booking-page max-w-2xl mx-auto p-6">
        <BookingResult result={bookingResult} onBookAnother={handleBookAnother} />
      </div>
    );
  }

  // Booking in progress
  if (isLoading) {
    return (
      <div className="auto-booking-page max-w-2xl mx-auto p-6">
        <div className="animate-pulse text-center py-12">
          <div className="text-4xl mb-4">⟳</div>
          <p className="font-semibold">Processing your booking...</p>
          <p className="text-gray-600 text-sm mt-2">
            Attempting to book at your preferred theatres
          </p>
        </div>
        <BookingProgressIndicator
          selectedTheatres={selectedTheatres}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Initial state - theatre selection
  return (
    <div className="auto-booking-page max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
        <p className="text-gray-600">
          Select up to 3 theatres in priority order. We'll automatically book
          at your preferred theatre.
        </p>
      </div>

      {/* Theatre Selection */}
      <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
        <TheatrePreferencesSelector
          availableTheatres={availableTheatres}
          selectedTheatres={selectedTheatres}
          onAddTheatre={addTheatrePreference}
          onRemoveTheatre={removeTheatrePreference}
        />
      </div>

      {/* Progress Indicator */}
      {selectedTheatres.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
          <BookingProgressIndicator
            selectedTheatres={selectedTheatres}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleBooking}
          disabled={selectedTheatres.length === 0 || isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Booking...' : 'Confirm Booking'}
        </button>
        <button className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50">
          Back
        </button>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded text-sm text-gray-600">
        <p className="font-semibold mb-2">Booking Summary</p>
        <ul className="space-y-1">
          <li>📽️ Movie: {movieId}</li>
          <li>🕐 Showtime: {showTimeId}</li>
          <li>🪑 Seats: {selectedSeats.join(', ')}</li>
          <li>
            🎭 Theatres: {selectedTheatres.length}/3 selected
            {selectedTheatres.length > 0 && (
              <ul className="ml-4 mt-1 space-y-1">
                {selectedTheatres.map((t, idx) => (
                  <li key={t.id}>
                    {idx + 1}. {t.name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
