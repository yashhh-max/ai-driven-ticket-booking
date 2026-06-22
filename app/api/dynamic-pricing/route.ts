import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Showtime pricing calculator helper
async function calculateShowtimePricing(supabase: any, showtimeId: string) {
  // Get showtime and seat data
  const { data: showtime, error: showtimeError } = await supabase
    .from('showtimes')
    .select('*, theater:theaters(seat_count)')
    .eq('id', showtimeId)
    .single();

  if (showtimeError || !showtime) {
    throw new Error('Showtime not found');
  }

  // Get current booking count
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('showtime_id', showtimeId)
    .eq('status', 'confirmed');

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

  return {
    showtime_id: showtimeId,
    base_price: basePrice,
    current_price: currentPrice,
    occupancy_percentage: occupancyPercentage,
    time_until_show_minutes: minutesUntilShow,
    price_multiplier: multiplier,
    updated_at: new Date().toISOString()
  };
}

// Calculate and update dynamic pricing for a showtime
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { showtimeId } = await request.json();

    if (!showtimeId) {
      return NextResponse.json({ error: 'Missing showtimeId' }, { status: 400 });
    }

    const calculated = await calculateShowtimePricing(supabase, showtimeId);

    // Upsert dynamic pricing (DB record), catch errors if table doesn't exist
    let pricingResult = calculated;
    try {
      const { data, error } = await supabase
        .from('dynamic_pricing')
        .upsert(calculated, { onConflict: 'showtime_id' })
        .select()
        .single();

      if (!error && data) {
        pricingResult = data;
      }
    } catch (upsertErr: any) {
      console.warn('[Dynamic Pricing API] Failed to upsert to DB, using in-memory fallback:', upsertErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Dynamic pricing calculated',
        pricing: {
          basePrice: pricingResult.base_price,
          currentPrice: pricingResult.current_price,
          multiplier: pricingResult.price_multiplier.toFixed(2),
          occupancyPercentage: pricingResult.occupancy_percentage,
          minutesUntilShow: pricingResult.time_until_show_minutes,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error calculating dynamic pricing:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dynamic pricing', details: error.message || error },
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

    if (!showtimeId) {
      return NextResponse.json({ error: 'Missing showtimeId' }, { status: 400 });
    }

    let pricingData = null;
    try {
      const { data, error } = await supabase
        .from('dynamic_pricing')
        .select('*')
        .eq('showtime_id', showtimeId)
        .single();

      if (!error && data) {
        pricingData = data;
      }
    } catch (getErr: any) {
      console.warn('[Dynamic Pricing API] Failed to fetch from DB:', getErr.message);
    }

    if (!pricingData) {
      // Calculate pricing dynamically in-memory
      pricingData = await calculateShowtimePricing(supabase, showtimeId);
      
      // Try to save to DB, ignore errors if table missing
      try {
        await supabase
          .from('dynamic_pricing')
          .upsert(pricingData, { onConflict: 'showtime_id' });
      } catch (upsertErr) {
        // Ignore
      }
    }

    return NextResponse.json({ data: pricingData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching dynamic pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing', details: error.message || error },
      { status: 500 }
    );
  }
}
