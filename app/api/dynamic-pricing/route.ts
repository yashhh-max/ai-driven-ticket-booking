import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Calculate and update dynamic pricing for a showtime
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { showtimeId } = await request.json();

    // Get showtime and seat data
    const { data: showtime, error: showtimeError } = await supabase
      .from('showtimes')
      .select('*, theater:theaters(seat_count)')
      .eq('id', showtimeId)
      .single();

    if (showtimeError || !showtime) {
      return NextResponse.json(
        { error: 'Showtime not found' },
        { status: 404 }
      );
    }

    // Get current booking count
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('showtime_id', showtimeId)
      .eq('booking_status', 'completed');

    if (bookingsError) throw bookingsError;

    const totalSeats = showtime.theater?.seat_count || 150;
    const bookedSeats = bookings?.length || 0;
    const occupancyPercentage = Math.round((bookedSeats / totalSeats) * 100);

    // Calculate time until showtime
    const showDateTime = new Date(`${showtime.show_date}T${showtime.show_time}`);
    const minutesUntilShow = Math.round(
      (showDateTime.getTime() - Date.now()) / (1000 * 60)
    );

    // Determine price multiplier based on occupancy and time
    let multiplier = 1.0;

    // High occupancy (80%+): increase price
    if (occupancyPercentage >= 80) {
      multiplier = 1.4;
    } else if (occupancyPercentage >= 60) {
      multiplier = 1.2;
    } else if (occupancyPercentage >= 40) {
      multiplier = 1.1;
    }

    // Last minute boost (< 2 hours)
    if (minutesUntilShow < 120 && minutesUntilShow > 0) {
      multiplier *= 1.15;
    }

    // Early bird discount (> 7 days)
    if (minutesUntilShow > 10080) {
      multiplier *= 0.85;
    }

    // Cap multiplier between 0.8 and 1.5
    multiplier = Math.max(0.8, Math.min(1.5, multiplier));

    // Get base price from showtime
    const basePrice = showtime.price || 250;
    const currentPrice = Math.round(basePrice * multiplier * 100) / 100;

    // Upsert dynamic pricing
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .upsert(
        {
          showtime_id: showtimeId,
          base_price: basePrice,
          current_price: currentPrice,
          occupancy_percentage: occupancyPercentage,
          time_until_show_minutes: minutesUntilShow,
          price_multiplier: multiplier,
        },
        { onConflict: 'showtime_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Dynamic pricing calculated',
        pricing: {
          basePrice,
          currentPrice,
          multiplier: multiplier.toFixed(2),
          occupancyPercentage,
          minutesUntilShow,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating dynamic pricing:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dynamic pricing' },
      { status: 500 }
    );
  }
}

// Get pricing for a showtime
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const showtimeId = searchParams.get('showtimeId');

    const { data, error } = await supabase
      .from('dynamic_pricing')
      .select('*')
      .eq('showtime_id', showtimeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // If no pricing exists, calculate it
      const { data: newPricing } = await supabase.functions.invoke(
        'calculate-pricing',
        { body: { showtimeId } }
      );
      return NextResponse.json({ data: newPricing }, { status: 200 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dynamic pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

