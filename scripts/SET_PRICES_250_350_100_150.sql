-- ============================================================
-- AI-DRIVEN TICKET BOOKING: Price Configuration
-- Set Regular Booking (250-350) and Auto-Booking (100-150)
-- ============================================================

-- Step 1: Update regular showtimes to 250-350
UPDATE showtimes 
SET price = CASE 
    WHEN theaters.name LIKE '%IMAX%' THEN 350.00
    WHEN theaters.name LIKE '%Dolby%' THEN 325.00
    ELSE 250.00
END
FROM theaters
WHERE showtimes.theater_id = theaters.id
  AND (showtimes.ticket_release_time IS NULL 
       OR showtimes.ticket_release_time <= NOW());

-- Step 2: Update auto-booking showtimes to 100-150
UPDATE showtimes 
SET price = CASE 
    WHEN theaters.name LIKE '%IMAX%' THEN 150.00
    WHEN theaters.name LIKE '%Dolby%' THEN 130.00
    ELSE 100.00
END
FROM theaters
WHERE showtimes.theater_id = theaters.id
  AND showtimes.ticket_release_time > NOW();

-- Step 3: Verify the changes
SELECT 
  'Price Summary' as info,
  COUNT(*) as total_showtimes,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM showtimes;

-- Step 4: Show breakdown by price
SELECT price, COUNT(*) as count FROM showtimes GROUP BY price ORDER BY price;

-- Step 5: Show breakdown by type and theater
SELECT 
  t.name as theater,
  CASE 
    WHEN s.ticket_release_time > NOW() THEN 'Auto-Book'
    ELSE 'Regular'
  END as booking_type,
  s.price,
  COUNT(*) as count
FROM showtimes s
JOIN theaters t ON s.theater_id = t.id
GROUP BY t.name, booking_type, s.price
ORDER BY t.name, booking_type, s.price;
