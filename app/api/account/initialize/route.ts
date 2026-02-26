import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to initialize account system for authenticated user
 * Creates user profile and loyalty points records
 * 
 * POST /api/account/initialize
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Create profile
      await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          preferred_language: 'en'
        })
    }

    // Check if loyalty points exist
    const { data: existingLoyalty } = await supabase
      .from('user_loyalty_points')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingLoyalty) {
      // Create loyalty points with welcome bonus
      const welcomeBonus = 100
      await supabase
        .from('user_loyalty_points')
        .insert({
          user_id: user.id,
          total_points: welcomeBonus,
          available_points: welcomeBonus,
          redeemed_points: 0,
          lifetime_points: welcomeBonus
        })

      // Log the welcome bonus
      await supabase
        .from('loyalty_points_history')
        .insert({
          user_id: user.id,
          points_type: 'earned',
          points_amount: welcomeBonus,
          description: 'Welcome bonus'
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Account system initialized',
      profile: existingProfile,
      loyalty: existingLoyalty
    })
  } catch (error) {
    console.error('Error initializing account:', error)
    return NextResponse.json(
      { error: 'Failed to initialize account system' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check account system status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check tables exist
    const tables = {
      profiles: false,
      locations: false,
      wishlist: false,
      payments: false,
      transactions: false,
      refunds: false,
      loyalty: false,
      promo: false
    }

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.profiles = !profileError

      const { error: locError } = await supabase
        .from('user_saved_locations')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.locations = !locError

      const { error: wishError } = await supabase
        .from('user_wishlist')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.wishlist = !wishError

      const { error: payError } = await supabase
        .from('user_payment_methods')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.payments = !payError

      const { error: transError } = await supabase
        .from('user_transactions')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.transactions = !transError

      const { error: refError } = await supabase
        .from('user_refunds')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.refunds = !refError

      const { error: loyError } = await supabase
        .from('user_loyalty_points')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.loyalty = !loyError

      const { error: promoError } = await supabase
        .from('promo_codes')
        .select('count', { count: 'exact' })
        .limit(1)
      tables.promo = !promoError
    } catch (e) {
      // Tables not set up
    }

    const allTablesReady = Object.values(tables).every(v => v === true)

    return NextResponse.json({
      status: allTablesReady ? 'ready' : 'needs-setup',
      tables,
      message: allTablesReady 
        ? 'Account system is fully set up'
        : 'Account system databases need to be created'
    })
  } catch (error) {
    console.error('Error checking account status:', error)
    return NextResponse.json(
      { error: 'Failed to check account system status' },
      { status: 500 }
    )
  }
}
