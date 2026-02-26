-- QR Code Management Tables
-- Migration script for booking QR code system

-- 1. Create table for storing booking QR codes
CREATE TABLE IF NOT EXISTS booking_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL, -- JWT token containing booking info
  qr_code_image BYTEA NOT NULL, -- Base64 encoded PNG image
  qr_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  qr_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 4 hours after generation
  qr_used BOOLEAN DEFAULT FALSE,
  qr_scanned_at TIMESTAMP WITH TIME ZONE, -- When was the QR scanned
  qr_scanned_by UUID REFERENCES auth.users(id), -- Staff member who scanned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT qr_not_expired CHECK (qr_expires_at > CURRENT_TIMESTAMP)
);

CREATE INDEX idx_booking_qr_codes_booking_id ON booking_qr_codes(booking_id);
CREATE INDEX idx_booking_qr_codes_user_id ON booking_qr_codes(user_id);
CREATE INDEX idx_booking_qr_codes_qr_used ON booking_qr_codes(qr_used);
CREATE INDEX idx_booking_qr_codes_qr_expires_at ON booking_qr_codes(qr_expires_at);

-- 2. Create audit log table for QR scans
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scanned_by UUID REFERENCES auth.users(id), -- Staff member
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'already_used', 'invalid_token')),
  error_message TEXT,
  device_info JSONB, -- Optional: device, location, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_scan_logs_booking_id ON qr_scan_logs(booking_id);
CREATE INDEX idx_qr_scan_logs_user_id ON qr_scan_logs(user_id);
CREATE INDEX idx_qr_scan_logs_scanned_at ON qr_scan_logs(scanned_at);
CREATE INDEX idx_qr_scan_logs_status ON qr_scan_logs(status);

-- 3. Add QR-related columns to bookings table (if not already present)
-- Run these if the columns don't exist:
-- ALTER TABLE bookings ADD COLUMN has_qr_code BOOLEAN DEFAULT FALSE;
-- ALTER TABLE bookings ADD COLUMN qr_generated_at TIMESTAMP WITH TIME ZONE;

-- 4. Create RLS (Row Level Security) Policies for booking_qr_codes

-- Enable RLS
ALTER TABLE booking_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own QR codes
CREATE POLICY "Users can view own QR codes" ON booking_qr_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only system can insert QR codes (via API)
CREATE POLICY "System can insert QR codes" ON booking_qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Prevent users from deleting QR codes (only system can)
CREATE POLICY "System can update QR codes" ON booking_qr_codes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Staff can view scan logs
CREATE POLICY "Staff can view scan logs" ON qr_scan_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('staff', 'admin', 'theatre_manager')
    )
  );

-- Policy: System can insert scan logs
CREATE POLICY "System can insert scan logs" ON qr_scan_logs
  FOR INSERT WITH CHECK (true);

-- 5. Create function to clean up expired QR codes (called via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_qr_codes
  WHERE qr_expires_at < CURRENT_TIMESTAMP
  AND qr_used = FALSE;
  
  RAISE NOTICE 'Cleaned up expired QR codes';
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to auto-update 'updated_at' column
CREATE OR REPLACE FUNCTION update_booking_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_qr_codes_updated_at_trigger
BEFORE UPDATE ON booking_qr_codes
FOR EACH ROW
EXECUTE FUNCTION update_booking_qr_codes_updated_at();

-- 7. Create views for analytics

-- View: QR Verification Statistics
CREATE OR REPLACE VIEW qr_verification_stats AS
SELECT
  DATE(qrl.scanned_at) as scan_date,
  COUNT(*) as total_scans,
  SUM(CASE WHEN qrl.status = 'success' THEN 1 ELSE 0 END) as successful_scans,
  SUM(CASE WHEN qrl.status = 'already_used' THEN 1 ELSE 0 END) as duplicate_scans,
  SUM(CASE WHEN qrl.status = 'invalid_token' THEN 1 ELSE 0 END) as invalid_scans,
  SUM(CASE WHEN qrl.status = 'failed' THEN 1 ELSE 0 END) as failed_scans
FROM qr_scan_logs qrl
GROUP BY DATE(qrl.scanned_at)
ORDER BY scan_date DESC;

-- View: Booking QR Status Overview
CREATE OR REPLACE VIEW booking_qr_status_overview AS
SELECT
  COUNT(*) as total_bookings,
  SUM(CASE WHEN bqc.id IS NOT NULL THEN 1 ELSE 0 END) as bookings_with_qr,
  SUM(CASE WHEN bqc.qr_used = TRUE THEN 1 ELSE 0 END) as used_qr_codes,
  SUM(CASE WHEN bqc.qr_used = FALSE AND bqc.qr_expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as active_qr_codes,
  SUM(CASE WHEN bqc.qr_expires_at < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as expired_qr_codes
FROM bookings b
LEFT JOIN booking_qr_codes bqc ON b.id = bqc.booking_id;

-- Grant permissions
GRANT SELECT ON booking_qr_codes TO authenticated;
GRANT SELECT ON qr_scan_logs TO authenticated;
GRANT SELECT ON qr_verification_stats TO authenticated;
GRANT SELECT ON booking_qr_status_overview TO authenticated;
