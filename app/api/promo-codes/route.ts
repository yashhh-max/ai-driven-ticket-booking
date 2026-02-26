import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Validate and apply promo code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { code, bookingAmount, movieId, theaterId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find promo code
    const { data: promoCode, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !promoCode) {
      return NextResponse.json(
        { error: 'Invalid or expired promo code' },
        { status: 400 }
      );
    }

    // Check date validity
    const today = new Date().toISOString().split('T')[0];
    if (promoCode.valid_from > today || promoCode.valid_until < today) {
      return NextResponse.json(
        { error: 'Promo code not valid for this period' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (
      promoCode.max_uses &&
      promoCode.current_uses >= promoCode.max_uses
    ) {
      return NextResponse.json(
        { error: 'Promo code usage limit exceeded' },
        { status: 400 }
      );
    }

    // Check minimum booking amount
    if (
      promoCode.min_booking_amount &&
      bookingAmount < promoCode.min_booking_amount
    ) {
      return NextResponse.json(
        {
          error: `Minimum booking amount of ₹${promoCode.min_booking_amount} required`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = (bookingAmount * promoCode.discount_value) / 100;
      if (promoCode.max_discount) {
        discountAmount = Math.min(discountAmount, promoCode.max_discount);
      }
    } else {
      discountAmount = promoCode.discount_value;
    }

    const finalAmount = Math.max(0, bookingAmount - discountAmount);

    return NextResponse.json(
      {
        success: true,
        promoCodeId: promoCode.id,
        originalAmount: bookingAmount,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
        discountPercentage:
          promoCode.discount_type === 'percentage'
            ? promoCode.discount_value
            : null,
        description: promoCode.description,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}

// Record promo code usage
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { promoCodeId, bookingId, amountSaved } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Record usage
    const { data, error: usageError } = await supabase
      .from('promo_code_usage')
      .insert({
        promo_code_id: promoCodeId,
        user_id: user.id,
        booking_id: bookingId,
        amount_saved: amountSaved,
      })
      .select()
      .single();

    if (usageError) throw usageError;

    // Update current uses count
    await supabase.rpc('increment_promo_code_usage', {
      code_id: promoCodeId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Promo code applied successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error applying promo code:', error);
    return NextResponse.json(
      { error: 'Failed to apply promo code' },
      { status: 500 }
    );
  }
}

// Get active promo codes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('promo_codes')
      .select('id, code, description, discount_type, discount_value, max_discount, min_booking_amount')
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_until', today)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

