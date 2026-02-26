import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Request booking modification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      bookingId,
      newShowDate,
      newShowTime,
      newSeats,
      reason,
    } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if modification is allowed (before payment/confirmation)
    if (!['pending', 'pre_booked'].includes(booking.booking_status)) {
      return NextResponse.json(
        { error: 'Cannot modify completed or cancelled bookings' },
        { status: 400 }
      );
    }

    // Create modification record
    const { data, error } = await supabase
      .from('booking_modifications')
      .insert({
        booking_id: bookingId,
        old_show_date: booking.show_date,
        new_show_date: newShowDate || booking.show_date,
        old_show_time: booking.show_time,
        new_show_time: newShowTime || booking.show_time,
        old_seats: booking.selected_seats,
        new_seats: newSeats || booking.selected_seats,
        modification_type: determineModificationType(
          booking,
          newShowDate,
          newShowTime,
          newSeats
        ),
        reason,
      })
      .select()
      .single();

    if (error) throw error;

    // Update booking with modification info
    await supabase
      .from('bookings')
      .update({
        is_modified: true,
        modification_count: (booking.modification_count || 0) + 1,
        show_date: newShowDate || booking.show_date,
        show_time: newShowTime || booking.show_time,
        selected_seats: newSeats || booking.selected_seats,
      })
      .eq('id', bookingId);

    return NextResponse.json(
      {
        success: true,
        message: 'Booking modification request submitted',
        modificationId: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error modifying booking:', error);
    return NextResponse.json(
      { error: 'Failed to modify booking' },
      { status: 500 }
    );
  }
}

// Get modification history
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

    const { data, error } = await supabase
      .from('booking_modifications')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching modifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modification history' },
      { status: 500 }
    );
  }
}

function determineModificationType(
  booking: any,
  newShowDate: string | null,
  newShowTime: string | null,
  newSeats: string[] | null
): string {
  const dateChanged = newShowDate && newShowDate !== booking.show_date;
  const timeChanged = newShowTime && newShowTime !== booking.show_time;
  const seatsChanged = newSeats && newSeats.length !== booking.selected_seats.length;

  if (dateChanged && timeChanged) return 'combined';
  if (dateChanged) return 'date';
  if (timeChanged) return 'time';
  if (seatsChanged) return 'seats';
  return 'other';
}

