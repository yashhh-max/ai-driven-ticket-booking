-- Notifications table and setup
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- auto_booking, ticket_release, price_alert, booking_confirmed
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  related_pre_booking_id UUID REFERENCES pre_bookings(id) ON DELETE CASCADE,
  related_movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  delivery_methods TEXT[] DEFAULT ARRAY['in_app'], -- in_app, push, email
  delivery_status JSONB DEFAULT '{}', -- {push: pending, email: sent, etc}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_booking_enabled BOOLEAN DEFAULT true,
  auto_booking_method TEXT[] DEFAULT ARRAY['in_app', 'push'],
  ticket_release_enabled BOOLEAN DEFAULT true,
  ticket_release_method TEXT[] DEFAULT ARRAY['in_app', 'email'],
  price_alert_enabled BOOLEAN DEFAULT true,
  price_alert_method TEXT[] DEFAULT ARRAY['in_app', 'email'],
  booking_updates_enabled BOOLEAN DEFAULT true,
  booking_updates_method TEXT[] DEFAULT ARRAY['in_app', 'push'],
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_read_own_notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_insert_own_preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_pre_booking_id UUID DEFAULT NULL,
  p_movie_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
  v_methods TEXT[];
BEGIN
  -- Get user's notification preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Set default preferences if not found
  IF v_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Determine delivery methods based on type and preferences
  v_methods := ARRAY['in_app'];
  
  CASE p_type
    WHEN 'auto_booking' THEN
      IF v_prefs.auto_booking_enabled THEN
        v_methods := v_prefs.auto_booking_method;
      ELSE
        RETURN json_build_object('success', false, 'error', 'Notifications disabled for this type');
      END IF;
    WHEN 'ticket_release' THEN
      IF v_prefs.ticket_release_enabled THEN
        v_methods := v_prefs.ticket_release_method;
      ELSE
        RETURN json_build_object('success', false, 'error', 'Notifications disabled');
      END IF;
    WHEN 'price_alert' THEN
      IF v_prefs.price_alert_enabled THEN
        v_methods := v_prefs.price_alert_method;
      ELSE
        RETURN json_build_object('success', false, 'error', 'Notifications disabled');
      END IF;
    WHEN 'booking_confirmed' THEN
      IF v_prefs.booking_updates_enabled THEN
        v_methods := v_prefs.booking_updates_method;
      ELSE
        RETURN json_build_object('success', false, 'error', 'Notifications disabled');
      END IF;
  END CASE;

  -- Create notification
  INSERT INTO notifications (
    user_id, type, title, message,
    related_booking_id, related_pre_booking_id, related_movie_id,
    delivery_methods
  )
  VALUES (
    p_user_id, p_type, p_title, p_message,
    p_booking_id, p_pre_booking_id, p_movie_id,
    v_methods
  )
  RETURNING id INTO v_notification_id;

  RETURN json_build_object(
    'success', true,
    'notification_id', v_notification_id,
    'delivery_methods', v_methods
  );
END;
$$;

-- Update auto-booking function to create notifications
CREATE OR REPLACE FUNCTION process_pre_booking_with_notification(p_pre_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_id UUID;
  v_movie_title TEXT;
  v_pre_booking RECORD;
BEGIN
  -- Get pre-booking info
  SELECT pb.user_id, s.movie_id, m.title
  INTO v_user_id, v_pre_booking.showtime_id, v_movie_title
  FROM pre_bookings pb
  JOIN showtimes s ON s.id = pb.showtime_id
  JOIN movies m ON m.id = s.movie_id
  WHERE pb.id = p_pre_booking_id;

  -- Process the booking
  SELECT process_pre_booking(p_pre_booking_id) INTO v_result;

  -- If successful, create notification
  IF (v_result->>'success')::boolean THEN
    PERFORM create_notification(
      v_user_id,
      'auto_booking',
      'Booking Confirmed!',
      'Your auto-booking for ' || v_movie_title || ' has been confirmed.',
      (v_result->>'booking_id')::UUID,
      p_pre_booking_id,
      v_pre_booking.showtime_id
    );
  ELSE
    -- Send failure notification
    PERFORM create_notification(
      v_user_id,
      'auto_booking',
      'Booking Failed',
      'Your auto-booking for ' || v_movie_title || ' could not be completed: ' || (v_result->>'error'),
      NULL,
      p_pre_booking_id,
      v_pre_booking.showtime_id
    );
  END IF;

  RETURN v_result;
END;
$$;
