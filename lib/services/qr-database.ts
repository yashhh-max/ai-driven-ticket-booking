/**
 * Database operations for QR codes and booking QR data
 * Handles saving, retrieving, and updating QR-related booking information
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export interface QRBookingData {
  booking_id: string;
  user_id: string;
  qr_token: string;
  qr_code_image: string; // Base64 encoded PNG
  qr_generated_at: string; // ISO timestamp
  qr_expires_at: string; // ISO timestamp
  qr_used: boolean;
  qr_scanned_at?: string | null; // ISO timestamp when QR was scanned
  qr_scanned_by?: string | null; // Staff ID who scanned
}

/**
 * Save QR code data after successful booking confirmation
 * Called immediately after booking is confirmed in the payment/booking system
 */
export async function saveBookingQRCode(
  bookingId: string,
  userId: string,
  qrToken: string,
  qrDataUrl: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[QR DB] Saving QR code for booking:', bookingId)
    
    // Try to use admin client, fallback to standard client if not available
    let supabase: any
    try {
      supabase = createAdminClient()
      if (!supabase) {
        console.log('[QR DB] Admin client not available, using authenticated client')
        supabase = await createClient()
      }
    } catch (adminError) {
      console.warn('[QR DB] Admin client creation failed, using authenticated client:', adminError)
      supabase = await createClient()
    }

    // Remove data URL prefix if present
    const qrImageBase64 = qrDataUrl.startsWith('data:image/png;base64,')
      ? qrDataUrl.split(',')[1]
      : qrDataUrl;

    console.log('[QR DB] Attempting to insert QR code record...')

    const { data, error } = await supabase
      .from('booking_qr_codes')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        qr_token: qrToken,
        qr_code_image: qrImageBase64,
        qr_generated_at: new Date().toISOString(),
        qr_expires_at: expiresAt,
        qr_used: false,
      })
      .select();

    if (error) {
      console.error('[QR DB] Insert error:', {
        code: (error as any).code,
        message: error.message,
        details: (error as any).details,
      })
      return { success: false, error: error.message };
    }

    console.log('[QR DB] QR code inserted successfully:', data?.[0]?.id)

    console.log('[QR DB] ✅ QR code saved successfully')
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[QR DB] Exception:', { message: errorMessage, stack: errorStack })
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Retrieve QR code data for a booking
 */
export async function getBookingQRCode(
  bookingId: string
): Promise<{ data?: QRBookingData; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('booking_qr_codes')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: 'QR code not found' };
    }

    return { data: data as QRBookingData };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Verify booking and update QR used status
 * Called when QR is scanned at the theatre
 */
export async function markQRAsUsed(
  bookingId: string,
  staffId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get QR code and booking data
    const { data: qrData, error: qrError } = await supabase
      .from('booking_qr_codes')
      .select('*, bookings(id, status, user_id)')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (qrError) {
      return { success: false, error: qrError.message };
    }

    if (!qrData) {
      return { success: false, error: 'QR code not found' };
    }

    // Validate QR hasn't been used
    if (qrData.qr_used) {
      return {
        success: false,
        error: 'This ticket has already been used',
        message: 'QR Already Used',
      };
    }

    // Validate booking is confirmed
    const booking = qrData.bookings;
    if (!booking || booking.status !== 'confirmed') {
      return {
        success: false,
        error: 'Booking is not confirmed',
        message: 'Invalid Ticket',
      };
    }

    // Mark QR as used
    const { error: updateError } = await supabase
      .from('booking_qr_codes')
      .update({
        qr_used: true,
        qr_scanned_at: new Date().toISOString(),
        qr_scanned_by: staffId || null,
      })
      .eq('booking_id', bookingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log the QR scan for audit trail
    const { error: auditError } = await supabase
      .from('qr_scan_logs')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        scanned_at: new Date().toISOString(),
        scanned_by: staffId || null,
        status: 'success',
      });

    if (auditError) {
      console.warn('Failed to log QR scan:', auditError);
      // Don't fail the operation if audit logging fails
    }

    return {
      success: true,
      message: 'QR verified successfully, ticket entry recorded',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get booking details for QR verification
 */
export async function getBookingDetails(bookingId: string): Promise<{
  data?: {
    id: string;
    user_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    showtime: {
      movie_id: string;
      theater_id: string;
      show_date: string;
      show_time: string;
    };
    seats: Array<{ 
      seat_id: string; 
      price: number;
      seat?: {
        row_label: string;
        seat_number: number;
      }
    }>;
    total_amount: number;
    created_at: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        user_id,
        status,
        total_amount,
        created_at,
        showtime:showtimes(movie_id, theater_id, show_date, show_time),
        seats:booked_seats(seat_id, price, seat:seats(row_label, seat_number))
      `
      )
      .eq('id', bookingId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete QR code (for cancelled bookings)
 */
export async function deleteBookingQRCode(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('booking_qr_codes')
      .delete()
      .eq('booking_id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get all scanned QRs for a date range (for analytics)
 */
export async function getScannedQRsReport(
  startDate: string,
  endDate: string
): Promise<{
  data?: Array<{
    booking_id: string;
    user_id: string;
    scanned_at: string;
    scanned_by: string | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qr_scan_logs')
      .select('booking_id, user_id, scanned_at, scanned_by')
      .gte('scanned_at', startDate)
      .lte('scanned_at', endDate)
      .order('scanned_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
