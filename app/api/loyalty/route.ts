import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Get loyalty profile for user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user loyalty points profile
    let { data: profile, error: profileError } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If profile doesn't exist, create it (lazy seeding)
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('user_loyalty_points')
        .insert({
          user_id: user.id,
          total_points: 0,
          available_points: 0,
          redeemed_points: 0,
          lifetime_points: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      profile = newProfile;
    } else if (profileError) {
      throw profileError;
    }

    // Get loyalty history
    const { data: history } = await supabase
      .from('loyalty_points_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Determine Tier based on lifetime points
    let tier = 'Bronze';
    const lifetime = profile.lifetime_points || 0;
    if (lifetime >= 1000) tier = 'Platinum';
    else if (lifetime >= 500) tier = 'Gold';
    else if (lifetime >= 200) tier = 'Silver';

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        tier
      },
      history: history || []
    });
  } catch (error: any) {
    console.error('Error fetching loyalty info:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch loyalty info' }, { status: 500 });
  }
}

// Award or redeem loyalty points
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, action, points } = await request.json();

    if (!bookingId || !action || typeof points !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get current loyalty profile
    let { data: profile, error: profileError } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    if (action === 'redeem') {
      if (profile.available_points < points) {
        return NextResponse.json({ error: 'Insufficient points balance' }, { status: 400 });
      }

      // 1. Deduct points
      const { error: updateError } = await supabase
        .from('user_loyalty_points')
        .update({
          available_points: profile.available_points - points,
          redeemed_points: (profile.redeemed_points || 0) + points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 2. Log transaction
      const { error: historyError } = await supabase
        .from('loyalty_points_history')
        .insert({
          user_id: user.id,
          points_type: 'redeemed',
          points_amount: points,
          booking_id: bookingId,
          description: `Redeemed points for discount on booking ${bookingId}`
        });

      if (historyError) throw historyError;

    } else if (action === 'earn') {
      // 1. Add points
      const { error: updateError } = await supabase
        .from('user_loyalty_points')
        .update({
          available_points: profile.available_points + points,
          total_points: (profile.total_points || 0) + points,
          lifetime_points: (profile.lifetime_points || 0) + points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 2. Log transaction
      const { error: historyError } = await supabase
        .from('loyalty_points_history')
        .insert({
          user_id: user.id,
          points_type: 'earned',
          points_amount: points,
          booking_id: bookingId,
          description: `Earned points from booking ${bookingId}`
        });

      if (historyError) throw historyError;
    }

    return NextResponse.json({ success: true, message: `Points successfully ${action}ed` });
  } catch (error: any) {
    console.error('Error modifying loyalty points:', error);
    return NextResponse.json({ error: error.message || 'Failed to modify loyalty points' }, { status: 500 });
  }
}
