-- Add location column to theaters table
ALTER TABLE theaters ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'hyderabad';

-- Update existing theaters with locations (sample data)
UPDATE theaters SET location = 'hyderabad' WHERE name LIKE '%Hyderabad%' OR name LIKE '%IMAX%' OR name LIKE '%PVR%';
UPDATE theaters SET location = 'bangalore' WHERE name LIKE '%Bangalore%' OR name LIKE '%Indiranagar%';
UPDATE theaters SET location = 'mumbai' WHERE name LIKE '%Mumbai%' OR name LIKE '%Bandra%';
UPDATE theaters SET location = 'delhi' WHERE name LIKE '%Delhi%' OR name LIKE '%Connaught%';

-- If no theaters with location, set them to hyderabad by default
UPDATE theaters SET location = 'hyderabad' WHERE location IS NULL OR location = '';

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_theaters_location ON theaters(location);
