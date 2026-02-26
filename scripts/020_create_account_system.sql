-- MyAccount System Database Schema Extension
-- Comprehensive account management for users

-- 1. USER PROFILES (Extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT,
  preferred_language TEXT DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER ADDRESSES / SAVED LOCATIONS
CREATE TABLE IF NOT EXISTS user_saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_type TEXT NOT NULL, -- 'home', 'work', 'favorite_theatre'
  city TEXT NOT NULL,
  state TEXT,
  address TEXT,
  theatre_id UUID REFERENCES theaters(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WISHLIST / SAVED MOVIES
CREATE TABLE IF NOT EXISTS user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- 4. SAVED PAYMENT METHODS
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL, -- 'card', 'wallet'
  card_last_four TEXT,
  card_brand TEXT, -- 'visa', 'mastercard', 'amex'
  card_holder_name TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTION HISTORY
CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'booking', 'refund', 'wallet_topup'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method_id UUID REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
  transaction_id TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REFUND REQUESTS
CREATE TABLE IF NOT EXISTS user_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES user_transactions(id) ON DELETE SET NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROMO CODES
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_booking_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USER PROMO CODE USAGE
CREATE TABLE IF NOT EXISTS user_promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_applied DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id, booking_id)
);

-- 9. LOYALTY POINTS / REWARDS
CREATE TABLE IF NOT EXISTS user_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  redeemed_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LOYALTY POINTS HISTORY
CREATE TABLE IF NOT EXISTS loyalty_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_type TEXT NOT NULL, -- 'earned', 'redeemed', 'expired'
  points_amount INTEGER NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES user_transactions(id) ON DELETE SET NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. POINTS REDEMPTION REQUESTS
CREATE TABLE IF NOT EXISTS points_redemption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  redemption_type TEXT NOT NULL, -- 'discount_coupon', 'cashback'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'failed'
  equivalent_amount DECIMAL(10, 2),
  coupon_code TEXT,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PASSWORD CHANGE HISTORY
CREATE TABLE IF NOT EXISTS password_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_redemption ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_change_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Profiles: Users can only view and update their own
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- User Saved Locations: Users can manage only their own
DROP POLICY IF EXISTS "user_locations_select_own" ON user_saved_locations;
CREATE POLICY "user_locations_select_own" ON user_saved_locations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_locations_insert_own" ON user_saved_locations;
CREATE POLICY "user_locations_insert_own" ON user_saved_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_locations_update_own" ON user_saved_locations;
CREATE POLICY "user_locations_update_own" ON user_saved_locations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_locations_delete_own" ON user_saved_locations;
CREATE POLICY "user_locations_delete_own" ON user_saved_locations FOR DELETE USING (auth.uid() = user_id);

-- User Wishlist: Users can manage only their own
DROP POLICY IF EXISTS "user_wishlist_select_own" ON user_wishlist;
CREATE POLICY "user_wishlist_select_own" ON user_wishlist FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_wishlist_insert_own" ON user_wishlist;
CREATE POLICY "user_wishlist_insert_own" ON user_wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_wishlist_delete_own" ON user_wishlist;
CREATE POLICY "user_wishlist_delete_own" ON user_wishlist FOR DELETE USING (auth.uid() = user_id);

-- Payment Methods: Users can manage only their own
DROP POLICY IF EXISTS "payment_methods_select_own" ON user_payment_methods;
CREATE POLICY "payment_methods_select_own" ON user_payment_methods FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "payment_methods_insert_own" ON user_payment_methods;
CREATE POLICY "payment_methods_insert_own" ON user_payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "payment_methods_update_own" ON user_payment_methods;
CREATE POLICY "payment_methods_update_own" ON user_payment_methods FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "payment_methods_delete_own" ON user_payment_methods;
CREATE POLICY "payment_methods_delete_own" ON user_payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Transactions: Users can view only their own
DROP POLICY IF EXISTS "transactions_select_own" ON user_transactions;
CREATE POLICY "transactions_select_own" ON user_transactions FOR SELECT USING (auth.uid() = user_id);

-- Refunds: Users can view and create their own
DROP POLICY IF EXISTS "refunds_select_own" ON user_refunds;
CREATE POLICY "refunds_select_own" ON user_refunds FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "refunds_insert_own" ON user_refunds;
CREATE POLICY "refunds_insert_own" ON user_refunds FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Promo Codes: Public read access for active codes
DROP POLICY IF EXISTS "promo_codes_public_read" ON promo_codes;
CREATE POLICY "promo_codes_public_read" ON promo_codes FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

-- User Promo Usage: Users can view only their own
DROP POLICY IF EXISTS "user_promo_usage_select_own" ON user_promo_usage;
CREATE POLICY "user_promo_usage_select_own" ON user_promo_usage FOR SELECT USING (auth.uid() = user_id);

-- Loyalty Points: Users can view only their own
DROP POLICY IF EXISTS "loyalty_points_select_own" ON user_loyalty_points;
CREATE POLICY "loyalty_points_select_own" ON user_loyalty_points FOR SELECT USING (auth.uid() = user_id);

-- Loyalty Points History: Users can view only their own
DROP POLICY IF EXISTS "loyalty_history_select_own" ON loyalty_points_history;
CREATE POLICY "loyalty_history_select_own" ON loyalty_points_history FOR SELECT USING (auth.uid() = user_id);

-- Points Redemption: Users can manage only their own
DROP POLICY IF EXISTS "points_redemption_select_own" ON points_redemption;
CREATE POLICY "points_redemption_select_own" ON points_redemption FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "points_redemption_insert_own" ON points_redemption;
CREATE POLICY "points_redemption_insert_own" ON points_redemption FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Password History: Users can view only their own
DROP POLICY IF EXISTS "password_history_select_own" ON password_change_history;
CREATE POLICY "password_history_select_own" ON password_change_history FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user ON user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_movie ON user_wishlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON user_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_user_refunds_user ON user_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_refunds_booking ON user_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON user_promo_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON user_loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_user ON loyalty_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_redemption_user ON points_redemption(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_change_history(user_id);
