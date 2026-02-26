-- Delete all old showtimes
DELETE FROM showtimes;

-- Recreate showtimes with prices 250-350
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, is_active)
SELECT 
  m.id,
  t.id,
  CURRENT_DATE + d.day_offset,
  time_slot.show_time,
  CASE 
    WHEN t.name LIKE '%IMAX%' THEN 350.00
    WHEN t.name LIKE '%Dolby%' THEN 325.00
    ELSE 250.00
  END,
  true
FROM movies m
CROSS JOIN theaters t
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (
  VALUES 
    ('10:30'::TIME),
    ('13:15'::TIME),
    ('16:00'::TIME),
    ('19:00'::TIME),
    ('21:45'::TIME)
) AS time_slot(show_time)
WHERE m.is_now_showing = true
  AND (
    -- IMAX shows blockbusters
    (t.name LIKE '%IMAX%' AND m.genre IN ('Sci-Fi', 'Action', 'Thriller')) OR
    -- Dolby shows various genres
    (t.name LIKE '%Dolby%' AND m.genre IN ('Sci-Fi', 'Action', 'Thriller', 'Drama', 'Comedy')) OR
    -- Standard shows all
    (t.name LIKE '%Standard%')
  );

-- Verify prices
SELECT DISTINCT price FROM showtimes ORDER BY price;
