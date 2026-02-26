-- Add new columns to bookings table for partial bookings and modifications
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS original_time TIME,
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0;

-- Create recurring_bookings table
CREATE TABLE IF NOT EXISTS recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  theater_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  show_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_book BOOLEAN DEFAULT false, -- automatically book when released
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, notified, booked, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  UNIQUE(showtime_id, user_id)
);

-- Create partial_bookings table
CREATE TABLE IF NOT EXISTS partial_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  selected_seat_ids TEXT[] NOT NULL, -- array of seat IDs
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create booking_modifications table (audit trail)
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_show_date DATE,
  new_show_date DATE,
  old_show_time TIME,
  new_show_time TIME,
  old_seats TEXT[],
  new_seats TEXT[],
  modification_type TEXT, -- 'date', 'time', 'seats', 'combined'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dynamic_pricing table
CREATE TABLE IF NOT EXISTS dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  base_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  occupancy_percentage INTEGER DEFAULT 0, -- 0-100
  time_until_show_minutes INTEGER, -- minutes until showtime
  price_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- 0.8 to 1.5
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(showtime_id)
);

-- Enable RLS for new tables
ALTER TABLE recurring_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE partial_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "recurring_bookings_user_access" ON recurring_bookings 
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "waitlist_user_access" ON waitlist 
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "partial_bookings_user_access" ON partial_bookings 
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "booking_modifications_user_access" ON booking_modifications 
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "dynamic_pricing_public_read" ON dynamic_pricing 
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_user_id ON recurring_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_active ON recurring_bookings(is_active);
CREATE INDEX IF NOT EXISTS idx_waitlist_showtime_id ON waitlist(showtime_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_partial_bookings_user_id ON partial_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_partial_bookings_expires ON partial_bookings(expires_at);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_showtime ON dynamic_pricing(showtime_id);
