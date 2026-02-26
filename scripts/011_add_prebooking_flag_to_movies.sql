-- Migration to add has_prebooking flag to movies table
-- This flag marks movies that have prebooking showtimes available

-- Add has_prebooking column to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS has_prebooking BOOLEAN DEFAULT FALSE;

-- Update movies to mark those with prebooking showtimes
UPDATE movies 
SET has_prebooking = TRUE
WHERE id IN (
  SELECT DISTINCT s.movie_id 
  FROM showtimes s
  JOIN pre_bookings pb ON pb.showtime_id = s.id
  WHERE s.is_active = TRUE
    AND pb.status IN ('queued', 'processing', 'completed')
);

-- Alternative: Mark all movies with future showtimes that have prebooking potential
-- (showtimes with ticket_release_time in the future)
UPDATE movies 
SET has_prebooking = TRUE
WHERE id IN (
  SELECT DISTINCT s.movie_id 
  FROM showtimes s
  WHERE s.is_active = TRUE
    AND s.ticket_release_time > NOW()
);

-- Create index on has_prebooking for faster filtering
CREATE INDEX IF NOT EXISTS idx_movies_has_prebooking ON movies(has_prebooking);

-- Create index on movies_id and has_prebooking combined for search queries
CREATE INDEX IF NOT EXISTS idx_movies_search_with_prebooking ON movies(has_prebooking, created_at DESC);

-- Optional: Create a view for easy querying of prebookable movies
CREATE OR REPLACE VIEW movies_with_prebooking AS
SELECT 
  m.*,
  COUNT(DISTINCT pb.id) as prebooking_count,
  COUNT(DISTINCT s.id) as total_showtimes,
  MIN(s.show_date) as next_show_date
FROM movies m
LEFT JOIN showtimes s ON s.movie_id = m.id AND s.is_active = TRUE
LEFT JOIN pre_bookings pb ON pb.showtime_id = s.id AND pb.status IN ('queued', 'processing', 'completed')
WHERE m.has_prebooking = TRUE
GROUP BY m.id;

-- Add comment explaining the column
COMMENT ON COLUMN movies.has_prebooking IS 'Boolean flag indicating if this movie has any active prebooking showtimes';
