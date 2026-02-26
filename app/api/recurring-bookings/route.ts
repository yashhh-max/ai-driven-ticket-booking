import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Create recurring booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      movieId,
      theaterId,
      dayOfWeek,
      showTime,
      startDate,
      endDate,
      autoBook,
    } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('recurring_bookings')
      .insert({
        user_id: user.id,
        movie_id: movieId,
        theater_id: theaterId,
        day_of_week: dayOfWeek,
        show_time: showTime,
        start_date: startDate,
        end_date: endDate,
        auto_book: autoBook,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Recurring booking created successfully',
        recurringBookingId: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recurring booking:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring booking' },
      { status: 500 }
    );
  }
}

// Get all recurring bookings for current user
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
      .from('recurring_bookings')
      .select(
        `
        *,
        movies (title, poster_url),
        theaters (name, location)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recurring bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring bookings' },
      { status: 500 }
    );
  }
}

// Update recurring booking
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const recurringBookingId = searchParams.get('id');
    const { isActive } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('recurring_bookings')
      .update({ is_active: isActive })
      .eq('id', recurringBookingId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Recurring booking updated', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating recurring booking:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring booking' },
      { status: 500 }
    );
  }
}

// Delete recurring booking
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const recurringBookingId = searchParams.get('id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('recurring_bookings')
      .delete()
      .eq('id', recurringBookingId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Recurring booking deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting recurring booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring booking' },
      { status: 500 }
    );
  }
}

