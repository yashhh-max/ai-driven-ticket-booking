import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Calculate group discount
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, numberOfTickets, pricePerTicket } =
      await request.json();

    // Discount tiers: 5-9 tickets = 5%, 10-19 = 10%, 20+ = 15%
    let discountPercentage = 0;
    if (numberOfTickets >= 20) {
      discountPercentage = 15;
    } else if (numberOfTickets >= 10) {
      discountPercentage = 10;
    } else if (numberOfTickets >= 5) {
      discountPercentage = 5;
    }

    if (numberOfTickets < 5) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Minimum 5 tickets required for group discount',
          discountPercentage: 0,
          discountAmount: 0,
        },
        { status: 400 }
      );
    }

    const originalTotal = numberOfTickets * pricePerTicket;
    const discountAmount = (originalTotal * discountPercentage) / 100;
    const finalTotal = originalTotal - discountAmount;

    // Store group booking discount
    const { data: groupBooking, error: groupError } = await supabase
      .from('group_bookings')
      .insert({
        booking_id: bookingId,
        group_size: numberOfTickets,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        original_total: originalTotal,
        final_total: finalTotal,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Update booking with final total
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ total_amount: finalTotal })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        success: true,
        groupBookingId: groupBooking.id,
        numberOfTickets,
        discountPercentage,
        originalTotal,
        discountAmount,
        finalTotal,
        message: `Group discount of ${discountPercentage}% applied! You save ₹${discountAmount.toFixed(2)}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating group discount:', error);
    return NextResponse.json(
      { error: 'Failed to calculate group discount' },
      { status: 500 }
    );
  }
}

// Get group booking details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      // Return all group bookings for user
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id);

      const bookingIds = userBookings?.map((b) => b.id) || [];

      const { data, error } = await supabase
        .from('group_bookings')
        .select('*')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ data }, { status: 200 });
    }

    // Return specific group booking
    const { data, error } = await supabase
      .from('group_bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching group booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group booking' },
      { status: 500 }
    );
  }
}

// Get group discount statistics (admin only)
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
        { error: 'Only admins can view statistics' },
        { status: 403 }
      );
    }

    // Get statistics
    const { data: stats, error } = await supabase
      .from('group_bookings')
      .select('group_size, discount_percentage, discount_amount, original_total');

    if (error) throw error;

    const totalDiscounts = stats?.reduce(
      (sum, g) => sum + g.discount_amount,
      0
    ) || 0;
    const totalGroupBookings = stats?.length || 0;
    const totalTicketsInGroups = stats?.reduce(
      (sum, g) => sum + g.group_size,
      0
    ) || 0;
    const averageGroupSize =
      totalGroupBookings > 0 ? totalTicketsInGroups / totalGroupBookings : 0;

    // Discount tier breakdown
    const tiers = {
      tier_5_9: stats?.filter((g) => g.group_size >= 5 && g.group_size < 10)
        .length,
      tier_10_19: stats?.filter((g) => g.group_size >= 10 && g.group_size < 20)
        .length,
      tier_20_plus: stats?.filter((g) => g.group_size >= 20).length,
    };

    return NextResponse.json(
      {
        success: true,
        totalGroupBookings,
        totalTicketsInGroups,
        averageGroupSize: parseFloat(averageGroupSize.toFixed(2)),
        totalDiscountsGiven: totalDiscounts,
        tiers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching group statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

