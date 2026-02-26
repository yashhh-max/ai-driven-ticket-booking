-- Create table for user theatre preferences
CREATE TABLE IF NOT EXISTS user_theatre_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theatre_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  priority INT NOT NULL CHECK (priority >= 1 AND priority <= 3),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, priority),
  UNIQUE(user_id, theatre_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_theatre_preferences_user_id 
ON user_theatre_preferences(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_theatre_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_theatre_preferences_timestamp ON user_theatre_preferences;
CREATE TRIGGER update_user_theatre_preferences_timestamp
BEFORE UPDATE ON user_theatre_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_theatre_preferences_updated_at();

-- Verify
SELECT COUNT(*) as preferences_count FROM user_theatre_preferences;
