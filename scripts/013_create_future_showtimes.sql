-- Migration to create new showtimes with future dates
-- This script generates showtimes for all movies across all theaters for the next 14 days

-- First, delete old showtimes that are in the past
DELETE FROM showtimes 
WHERE show_date < CURRENT_DATE;

-- Generate new showtimes for the next 14 days
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, is_active)
SELECT 
  m.id,
  t.id,
  CURRENT_DATE + (d.day_offset || ' days')::INTERVAL,
  time_slot.show_time,
  CASE 
    WHEN t.name ILIKE '%imax%' THEN 350.00
    WHEN t.name ILIKE '%dolby%' THEN 325.00
    WHEN t.name ILIKE '%premium%' THEN 300.00
    ELSE 250.00
  END,
  true
FROM movies m
CROSS JOIN theaters t
CROSS JOIN generate_series(1, 14) AS d(day_offset)
CROSS JOIN (
  VALUES 
    ('10:30'::TIME),
    ('13:15'::TIME),
    ('16:00'::TIME),
    ('19:00'::TIME),
    ('21:45'::TIME)
) AS time_slot(show_time)
WHERE m.id IS NOT NULL 
  AND t.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add ticket_release_time for pre-booking (24 hours before show)
UPDATE showtimes 
SET ticket_release_time = (show_date::TIMESTAMP + show_time::TIME) - INTERVAL '24 hours'
WHERE ticket_release_time IS NULL
  AND show_date >= CURRENT_DATE;

-- Create index for faster queries on showtimes
CREATE INDEX IF NOT EXISTS idx_showtimes_future 
ON showtimes(show_date, show_time) 
WHERE is_active = true;

-- Verify the showtimes were created
SELECT 
  COUNT(*) as total_showtimes,
  MIN(show_date) as first_show_date,
  MAX(show_date) as last_show_date,
  COUNT(DISTINCT movie_id) as movies,
  COUNT(DISTINCT theater_id) as theaters
FROM showtimes 
WHERE show_date >= CURRENT_DATE;
