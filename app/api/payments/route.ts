import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { generateBookingQRCode } from '@/lib/services/qr-code';
import { saveBookingQRCode } from '@/lib/services/qr-database';

// Initialize Razorpay lazily
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
  });
}

// Create payment order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      bookingId,
      amount,
      currency = 'INR',
      gateway = 'razorpay',
      paymentMethod,
    } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get gateway config
    const { data: gatewayConfig, error: gatewayError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('name', gateway)
      .eq('is_active', true)
      .single();

    if (gatewayError || !gatewayConfig) {
      return NextResponse.json(
        { error: 'Payment gateway not available' },
        { status: 400 }
      );
    }

    // Razorpay payment order creation
    if (gateway === 'razorpay') {
      const order = await getRazorpay().orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: `booking-${bookingId}`,
        notes: {
          booking_id: bookingId,
          user_id: user.id,
        },
      });

      // Record payment in database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          booking_id: bookingId,
          gateway_id: gatewayConfig.id,
          gateway_transaction_id: order.id,
          amount,
          currency,
          status: 'pending',
          payment_method: paymentMethod || 'razorpay',
          response_data: order,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          amount: order.amount / 100,
          currency: order.currency,
          paymentId: payment.id,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'Payment gateway not supported' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Verify payment
export async function PUT(request: NextRequest) {
  try {
    console.log('[PAYMENT API] PUT request received');
    const supabase = await createClient();

    const {
      orderId,
      paymentId,
      signature,
      gateway = 'razorpay',
    } = await request.json();

    console.log('[PAYMENT API] Verifying payment:', { orderId, paymentId, gateway });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[PAYMENT API] No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PAYMENT API] User authenticated:', user.id);

    // Verify Razorpay signature
    if (gateway === 'razorpay') {
      console.log('[PAYMENT API] Verifying Razorpay signature...');
      const hmac = crypto.createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET!
      );
      hmac.update(`${orderId}|${paymentId}`);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== signature) {
        console.warn('[PAYMENT API] Invalid payment signature');
        return NextResponse.json(
          { error: 'Invalid payment signature' },
          { status: 400 }
        );
      }

      console.log('[PAYMENT API] Signature verified successfully');

      // Update payment status
      console.log('[PAYMENT API] Updating payment status...');
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          gateway_transaction_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_transaction_id', orderId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[PAYMENT API] Payment update error:', error);
        throw error;
      }

      console.log('[PAYMENT API] Payment status updated, booking_id:', data.booking_id);

      // Update booking status
      if (data.booking_id) {
        console.log('[PAYMENT API] Starting QR generation for booking:', data.booking_id);
        
        // Fetch booking details with full seat information
        console.log('[PAYMENT API] Fetching booking details...');
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id,
            user_id,
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
          .eq('id', data.booking_id)
          .single();

        if (bookingError) {
          console.error('[PAYMENT API] Booking fetch error:', bookingError);
          throw bookingError;
        }

        console.log('[PAYMENT API] Booking fetched:', {
          bookingId: booking.id,
          seats: booking.booked_seats?.length || 0,
          theater_id: booking.showtime?.theater_id,
        });

        // Update booking status to confirmed
        console.log('[PAYMENT API] Updating booking status to confirmed...');
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed'
          })
          .eq('id', data.booking_id);

        if (updateError) {
          console.error('[PAYMENT API] Booking update error:', updateError);
          throw updateError;
        }

        console.log('[PAYMENT API] Booking status updated to confirmed');

        // Generate QR Code
        try {
          console.log('[PAYMENT API] Starting QR code generation...');
          
          // Format seat strings as "Row+SeatNumber" (e.g., "A1", "B5")
          const seatStrings = booking?.booked_seats?.map((bs: any) => {
            if (bs.seat && bs.seat.row_label && bs.seat.seat_number) {
              return `${bs.seat.row_label}${bs.seat.seat_number}`;
            }
            return bs.seat_id; // Fallback to seat_id if full details not available
          }) || [];
          
          console.log('[PAYMENT API] Formatted seats:', seatStrings);
          
          const qrResult = await generateBookingQRCode(
            data.booking_id,
            data.user_id,
            booking?.showtime?.theater_id || '',
            booking?.showtime?.show_date || '',
            booking?.showtime?.show_time || '',
            seatStrings
          );

          console.log('[PAYMENT API] QR code generated successfully, saving to database...');

          // Save QR to database
          const saveResult = await saveBookingQRCode(
            data.booking_id,
            data.user_id,
            qrResult.token,
            qrResult.qrDataUrl,
            qrResult.expiresAt
          );

          if (saveResult.success) {
            console.log('[PAYMENT API] ✅ QR code generated and saved for booking:', data.booking_id);
          } else {
            console.warn('[PAYMENT API] ⚠️ Failed to save QR code:', saveResult.error);
          }
        } catch (qrError) {
          console.error('[PAYMENT API] ⚠️ QR generation failed:', qrError instanceof Error ? qrError.message : qrError);
          // Don't fail payment if QR generation fails
        }
      } else {
        console.warn('[PAYMENT API] No booking_id in payment record');
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Payment verified successfully',
          paymentId: data.id,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Payment gateway not supported' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

// Get payment history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

