import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Create price drop alert
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { movieId, theaterId, targetPrice } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('price_drop_alerts')
      .insert({
        user_id: user.id,
        movie_id: movieId || null,
        theater_id: theaterId || null,
        target_price: targetPrice,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: `Alert created. You'll be notified when price drops below ₹${targetPrice}`,
        alertId: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating price alert:', error);
    return NextResponse.json(
      { error: 'Failed to create price alert' },
      { status: 500 }
    );
  }
}

// Get user's price alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('price_drop_alerts')
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
    console.error('Error fetching price alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price alerts' },
      { status: 500 }
    );
  }
}

// Delete price alert
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('price_drop_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Price alert deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete price alert' },
      { status: 500 }
    );
  }
}

// Predict price trends (AI feature)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { showtimeId } = await request.json();

    // Get price history for the showtime
    const { data: priceHistory, error: historyError } = await supabase
      .from('price_history')
      .select('price, recorded_at')
      .eq('showtime_id', showtimeId)
      .order('recorded_at', { ascending: true })
      .limit(30);

    if (historyError) throw historyError;

    if (!priceHistory || priceHistory.length < 2) {
      return NextResponse.json(
        { message: 'Not enough data for prediction' },
        { status: 200 }
      );
    }

    // Simple trend analysis
    const prices = priceHistory.map((p) => p.price);
    const avgPrice =
      prices.reduce((a, b) => a + b, 0) / prices.length;
    const trend =
      prices[prices.length - 1] > prices[0] ? 'increasing' : 'decreasing';
    const volatility = Math.max(...prices) - Math.min(...prices);

    const prediction = {
      currentPrice: prices[prices.length - 1],
      averagePrice: Math.round(avgPrice * 100) / 100,
      trend,
      volatility: Math.round(volatility * 100) / 100,
      recommendation:
        trend === 'decreasing'
          ? 'Price is dropping. Good time to book!'
          : 'Price is rising. Book soon if interested.',
    };

    return NextResponse.json(
      {
        success: true,
        prediction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error predicting price:', error);
    return NextResponse.json(
      { error: 'Failed to predict price' },
      { status: 500 }
    );
  }
}

