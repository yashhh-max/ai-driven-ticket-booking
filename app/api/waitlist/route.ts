import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Add user to waitlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { showtimeId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if showtime has available seats
    const { data: showtime, error: showtimeError } = await supabase
      .from('showtimes')
      .select('*, theater_seats(count)')
      .eq('id', showtimeId)
      .single();

    if (showtimeError) throw showtimeError;

    // Get current occupancy
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('showtime_id', showtimeId)
      .eq('booking_status', 'completed');

    if (bookingsError) throw bookingsError;

    const totalSeats = showtime.theater_seats[0]?.count || 150;
    const isShowFull = bookings.length >= totalSeats;

    if (!isShowFull) {
      return NextResponse.json(
        { error: 'Show is not full. Please book directly.' },
        { status: 400 }
      );
    }

    // Get current position in waitlist
    const { data: waitlistCount } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact' })
      .eq('showtime_id', showtimeId)
      .eq('status', 'waiting');

    const position = (waitlistCount?.length || 0) + 1;

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        user_id: user.id,
        showtime_id: showtimeId,
        position,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: `Added to waitlist at position ${position}. You'll be notified when seats become available.`,
        waitlistId: data.id,
        position,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}

// Get user's waitlist entries
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('waitlist')
      .select(
        `
        *,
        showtimes (
          id,
          show_date,
          show_time,
          movies (title, poster_url),
          theaters (name, location)
        )
      `
      )
      .eq('user_id', user.id)
      .neq('status', 'booked')
      .order('position', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

// Remove from waitlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const waitlistId = searchParams.get('id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('waitlist')
      .update({ status: 'cancelled' })
      .eq('id', waitlistId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Removed from waitlist' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from waitlist' },
      { status: 500 }
    );
  }
}

