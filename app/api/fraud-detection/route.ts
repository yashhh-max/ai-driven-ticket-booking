import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Analyze booking for fraud
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      bookingId,
      userId,
      amount,
      paymentMethod,
      userLocation,
      deviceInfo,
    } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let riskScore = 0;
    const flaggedRules: string[] = [];

    // Rule 1: Check booking velocity (multiple bookings in short time)
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (recentBookings && recentBookings.length > 5) {
      riskScore += 0.3;
      flaggedRules.push('VELOCITY_ALERT: Multiple bookings in short timeframe');
    }

    // Rule 2: Check for unusual payment method changes
    const { data: paymentHistory } = await supabase
      .from('payments')
      .select('payment_method')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const uniqueMethods = new Set(
      paymentHistory?.map((p) => p.payment_method)
    ).size;
    if (uniqueMethods > 3) {
      riskScore += 0.2;
      flaggedRules.push(
        'PAYMENT_PATTERN: Multiple payment methods used in recent bookings'
      );
    }

    // Rule 3: Check for large booking amounts
    if (amount > 10000) {
      riskScore += 0.15;
      flaggedRules.push('AMOUNT_ALERT: Unusually large booking amount');
    }

    // Rule 4: Check for location anomalies
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('last_known_location')
      .eq('id', userId)
      .single();

    if (userProfile?.last_known_location && userLocation) {
      // Simple distance check (in production, use geolocation API)
      const distance = Math.abs(
        parseInt(userProfile.last_known_location) - parseInt(userLocation)
      );
      if (distance > 500) {
        riskScore += 0.1;
        flaggedRules.push('LOCATION_ALERT: Booking from unusual location');
      }
    }

    // Rule 5: Check for suspended/flagged user account
    const { data: userAccount } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single();

    if (
      userAccount?.raw_user_meta_data?.fraud_flag ||
      userAccount?.raw_user_meta_data?.account_status === 'suspended'
    ) {
      riskScore += 0.5;
      flaggedRules.push('ACCOUNT_FLAG: User account flagged for suspicious activity');
    }

    // Create fraud alert if risk score > threshold
    if (riskScore > 0.3) {
      const { data: alert, error: alertError } = await supabase
        .from('fraud_alerts')
        .insert({
          user_id: userId,
          booking_id: bookingId,
          alert_type: 'automated_detection',
          risk_score: Math.min(1, riskScore),
          details: {
            flaggedRules,
            amount,
            paymentMethod,
          },
          status: riskScore > 0.7 ? 'blocked' : 'pending',
        })
        .select()
        .single();

      if (alertError) throw alertError;

      return NextResponse.json(
        {
          success: true,
          riskScore: Math.min(1, riskScore),
          status: riskScore > 0.7 ? 'blocked' : 'review_required',
          alertId: alert.id,
          flaggedRules,
          message:
            riskScore > 0.7
              ? 'Booking blocked due to fraud detection'
              : 'Booking requires manual review',
        },
        { status: riskScore > 0.7 ? 403 : 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        riskScore,
        status: 'approved',
        message: 'Booking approved',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze booking' },
      { status: 500 }
    );
  }
}

// Get fraud alerts (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view fraud alerts' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data, error } = await supabase
      .from('fraud_alerts')
      .select(
        `
        *,
        users:auth.users(email),
        bookings (id, total_amount)
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud alerts' },
      { status: 500 }
    );
  }
}

// Review fraud alert (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can review alerts' },
        { status: 403 }
      );
    }

    const { alertId, status, notes } = await request.json();

    const { data, error } = await supabase
      .from('fraud_alerts')
      .update({
        status,
        reviewed_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: `Alert marked as ${status}`,
        alert: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reviewing fraud alert:', error);
    return NextResponse.json(
      { error: 'Failed to review alert' },
      { status: 500 }
    );
  }
}

