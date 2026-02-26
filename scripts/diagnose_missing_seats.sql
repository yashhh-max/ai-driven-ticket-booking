-- Diagnose which theaters are missing seats

-- Find all theaters and count their seats
SELECT 
  t.id,
  t.name,
  COUNT(s.id) as seat_count
FROM theaters t
LEFT JOIN seats s ON s.theater_id = t.id
GROUP BY t.id, t.name
ORDER BY seat_count ASC;

-- Find theaters with ZERO seats
SELECT 
  t.id,
  t.name
FROM theaters t
LEFT JOIN seats s ON s.theater_id = t.id
GROUP BY t.id, t.name
HAVING COUNT(s.id) = 0;

-- Check seat distribution by row for each theatre
SELECT 
  t.name,
  s.row_label,
  COUNT(*) as seats_in_row
FROM theaters t
JOIN seats s ON s.theater_id = t.id
GROUP BY t.id, t.name, s.row_label
ORDER BY t.name, s.row_label;

-- Count total seats by theatre (detailed)
SELECT 
  t.name,
  COUNT(s.id) as total_seats,
  COUNT(DISTINCT s.row_label) as total_rows,
  MIN(s.seat_number) as min_seat_number,
  MAX(s.seat_number) as max_seat_number
FROM theaters t
LEFT JOIN seats s ON s.theater_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
