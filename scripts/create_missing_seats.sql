-- Fix missing seats for all theatres
-- This script creates a standard 10 rows x 12 seats layout for any theatre missing seats

-- First, check which theatres are missing seats
WITH theatres_without_seats AS (
  SELECT t.id, t.name
  FROM theaters t
  LEFT JOIN seats s ON s.theater_id = t.id
  GROUP BY t.id, t.name
  HAVING COUNT(s.id) = 0
)

-- Create seats for theatres that are missing them
INSERT INTO seats (theater_id, row_label, seat_number, seat_type)
SELECT 
  t.id,
  CHR(65 + (n.row_num - 1)) as row_label,
  n.seat_num,
  CASE 
    WHEN n.row_num <= 2 AND n.seat_num BETWEEN 4 AND 9 THEN 'vip'
    WHEN n.row_num BETWEEN 3 AND 8 AND n.seat_num BETWEEN 3 AND 10 THEN 'premium'
    ELSE 'standard'
  END as seat_type
FROM theaters t
CROSS JOIN (
  SELECT row_num, seat_num 
  FROM generate_series(1, 10) as row_num
  CROSS JOIN generate_series(1, 12) as seat_num
) n
WHERE t.id IN (
  SELECT theaters.id FROM theaters
  LEFT JOIN seats s ON s.theater_id = theaters.id
  GROUP BY theaters.id
  HAVING COUNT(s.id) = 0
)
ON CONFLICT (theater_id, row_label, seat_number) DO NOTHING;

-- Verify - show all theatres and their seat counts
SELECT 
  t.name,
  COUNT(s.id) as total_seats,
  COUNT(DISTINCT s.row_label) as rows
FROM theaters t
LEFT JOIN seats s ON s.theater_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
