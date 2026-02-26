-- Quick fix: Delete today's showtimes and recreate starting from tomorrow
DELETE FROM showtimes 
WHERE show_date = CURRENT_DATE;

-- Recreate showtimes starting from tomorrow for the next 14 days
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, is_active)
SELECT 
  m.id,
  t.id,
  CURRENT_DATE + make_interval(days => d.day_offset),
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

-- Verify
SELECT 
  COUNT(*) as total_showtimes,
  MIN(show_date) as earliest_date,
  MAX(show_date) as latest_date
FROM showtimes 
WHERE show_date >= CURRENT_DATE AND is_active = true;
