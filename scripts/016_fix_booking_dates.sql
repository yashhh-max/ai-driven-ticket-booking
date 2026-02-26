-- Fix: Ensure showtimes have future dates for booking to work
-- This script removes old showtimes and creates new ones with proper future dates

-- 1. Delete all past showtimes
DELETE FROM showtimes 
WHERE show_date < CURRENT_DATE;

-- 2. Delete today's showtimes to ensure we only have future dates
DELETE FROM showtimes 
WHERE show_date = CURRENT_DATE;

-- 3. Create fresh showtimes starting from TOMORROW for next 30 days
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, is_active)
SELECT 
  m.id,
  t.id,
  CURRENT_DATE + INTERVAL '1 day' * d.day_offset,
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
CROSS JOIN generate_series(1, 30) AS d(day_offset)
CROSS JOIN (
  VALUES 
    ('10:30'::TIME),
    ('13:15'::TIME),
    ('16:00'::TIME),
    ('19:00'::TIME),
    ('21:45'::TIME)
) AS time_slot(show_time)
WHERE m.id IS NOT NULL 
  AND t.id IS NOT NULL;

-- 4. Update ticket_release_time for pre-booking (24 hours before show)
UPDATE showtimes 
SET ticket_release_time = (show_date::TIMESTAMP + show_time::TIME) - INTERVAL '24 hours'
WHERE ticket_release_time IS NULL
  AND show_date >= CURRENT_DATE;

-- 5. Verify the data
SELECT 
  COUNT(*) as total_showtimes,
  MIN(show_date) as first_show_date,
  MAX(show_date) as last_show_date,
  COUNT(DISTINCT movie_id) as unique_movies,
  COUNT(DISTINCT theater_id) as unique_theaters
FROM showtimes 
WHERE show_date >= CURRENT_DATE 
  AND is_active = true;

-- 6. Show sample showtimes
SELECT 
  m.title,
  t.name,
  st.show_date,
  st.show_time,
  st.price
FROM showtimes st
JOIN movies m ON st.movie_id = m.id
JOIN theaters t ON st.theater_id = t.id
WHERE show_date >= CURRENT_DATE
  AND is_active = true
ORDER BY st.show_date, st.show_time
LIMIT 20;

-- User selects 3 preferred theatres in priority order:
--   1. Theatre A
--   2. Theatre B  
--   3. Theatre C

-- System automatically:
--   ✓ Tries Theatre A → Success? Return booking ID ✅
--   ✓ If failed, tries Theatre B → Success? Return booking ID ✅
--   ✓ If failed, tries Theatre C → Success? Return booking ID ✅
--   ✓ If all failed, return complete failure details ❌
