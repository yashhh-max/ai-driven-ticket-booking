-- Migration to add real theater names and locations
-- This script updates existing theaters with actual Indian cinema chain names
-- and adds new theaters if needed

-- First, ensure location column exists
ALTER TABLE theaters 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'hyderabad';

-- First, let's update the existing theaters with real names
UPDATE theaters 
SET name = 'PVR Cinemas - Imax Screen' 
WHERE name = 'Screen 1 - IMAX';

UPDATE theaters 
SET name = 'INOX Cinemas - Dolby Atmos' 
WHERE name = 'Screen 2 - Dolby Atmos';

UPDATE theaters 
SET name = 'Prasads IMAX Screen' 
WHERE name = 'Screen 3 - Standard';

-- Add more theaters for variety (in different locations)
-- Hyderabad Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Hyderabad', 12, 16, 'hyderabad'),
  ('Prasads IMAX - Hyderabad', 10, 14, 'hyderabad'),
  ('INOX Cinemas - Hyderabad', 11, 15, 'hyderabad'),
  ('Cinemax - Hyderabad', 9, 13, 'hyderabad'),
  ('AMB Cinemas - Hyderabad', 12, 16, 'hyderabad'),
  ('Sandhya Cinema - Hyderabad', 10, 14, 'hyderabad'),
  ('Sudharshan Theater - Hyderabad', 11, 15, 'hyderabad')
ON CONFLICT DO NOTHING;

-- Bangalore Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Bangalore', 12, 16, 'bangalore'),
  ('Cinepolis - Bangalore', 10, 14, 'bangalore'),
  ('INOX Cinemas - Bangalore', 11, 15, 'bangalore'),
  ('Gopalan Cinemas - Bangalore', 10, 14, 'bangalore'),
  ('Cinemax - Bangalore', 9, 13, 'bangalore')
ON CONFLICT DO NOTHING;

-- Mumbai Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Mumbai', 12, 16, 'mumbai'),
  ('Cinepolis - Mumbai', 10, 14, 'mumbai'),
  ('Regal Cinemas - Mumbai', 11, 15, 'mumbai'),
  ('INOX Cinemas - Mumbai', 12, 16, 'mumbai'),
  ('Imax Cinemas - Mumbai', 10, 14, 'mumbai')
ON CONFLICT DO NOTHING;

-- Delhi Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Delhi', 12, 16, 'delhi'),
  ('Cinepolis - Delhi', 10, 14, 'delhi'),
  ('INOX Cinemas - Delhi', 11, 15, 'delhi'),
  ('IMAX Delhi', 12, 16, 'delhi'),
  ('Dlf Cinemas - Delhi', 10, 14, 'delhi')
ON CONFLICT DO NOTHING;

-- Pune Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Pune', 11, 15, 'pune'),
  ('Cinepolis - Pune', 10, 14, 'pune'),
  ('E-Square Cinemas - Pune', 10, 14, 'pune'),
  ('INOX Cinemas - Pune', 11, 15, 'pune')
ON CONFLICT DO NOTHING;

-- Chennai Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Chennai', 12, 16, 'chennai'),
  ('Sathyam Cinemas - Chennai', 10, 14, 'chennai'),
  ('INOX Cinemas - Chennai', 11, 15, 'chennai'),
  ('AGS Cinemas - Chennai', 10, 14, 'chennai'),
  ('Urvashi Complex - Chennai', 9, 13, 'chennai'),
  ('Sandhya Cinema - Chennai', 10, 14, 'chennai'),
  ('Sudharshan Theater - Chennai', 11, 15, 'chennai')
ON CONFLICT DO NOTHING;

-- Kolkata Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Kolkata', 11, 15, 'kolkata'),
  ('Cinepolis - Kolkata', 10, 14, 'kolkata'),
  ('INOX Cinemas - Kolkata', 11, 15, 'kolkata'),
  ('Nandan - Kolkata', 9, 13, 'kolkata')
ON CONFLICT DO NOTHING;

-- Jaipur Theaters
INSERT INTO theaters (name, total_rows, seats_per_row, location) VALUES
  ('PVR Cinemas - Jaipur', 11, 15, 'jaipur'),
  ('Cinepolis - Jaipur', 10, 14, 'jaipur'),
  ('INOX Cinemas - Jaipur', 10, 14, 'jaipur'),
  ('Rajmandir - Jaipur', 10, 14, 'jaipur')
ON CONFLICT DO NOTHING;

-- Create index for theater location queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_theaters_location ON theaters(location);

-- Create index for theater name searches
CREATE INDEX IF NOT EXISTS idx_theaters_name ON theaters(name);
