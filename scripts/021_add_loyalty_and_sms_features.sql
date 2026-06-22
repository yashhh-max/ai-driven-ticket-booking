-- SMS Notifications logging table
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_read_own_sms_notifications" ON sms_notifications;
CREATE POLICY "users_read_own_sms_notifications" ON sms_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sms_notifications_user_id ON sms_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_created_at ON sms_notifications(created_at DESC);
