import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Save partial booking as draft
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { showtimeId, selectedSeatIds, totalAmount } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('partial_bookings')
      .insert({
        user_id: user.id,
        showtime_id: showtimeId,
        selected_seat_ids: selectedSeatIds,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Booking saved as draft. You can complete it within 24 hours.',
        partialBookingId: data.id,
        expiresAt: data.expires_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving partial booking:', error);
    return NextResponse.json(
      { error: 'Failed to save draft booking' },
      { status: 500 }
    );
  }
}

// Get all partial bookings for current user
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
      .from('partial_bookings')
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
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching partial bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft bookings' },
      { status: 500 }
    );
  }
}

// Delete partial booking
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const partialBookingId = searchParams.get('id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('partial_bookings')
      .delete()
      .eq('id', partialBookingId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Draft booking deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting partial booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft booking' },
      { status: 500 }
    );
  }
}

