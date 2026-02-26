-- Add new Telugu movies: Spirit (Prabhas) and Varanasi (Mahesh Babu)

-- Insert or update new movies
INSERT INTO movies (id, title, description, genre, duration_minutes, rating, poster_url, backdrop_url, release_date, is_now_showing) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Spirit', 'A high-octane action thriller starring Prabhas. An elite operative is drawn into a dangerous mission that will test his skills and loyalty.', 'Action', 148, 'UA', '/posters/spirit.jpg', '/backdrops/spirit.jpg', '2026-02-05', true),
  ('20000000-0000-0000-0000-000000000002', 'Varanasi', 'An epic drama starring Mahesh Babu set against the backdrop of the holy city. A journey of redemption and spiritual awakening.', 'Drama', 156, 'UA', '/posters/varanasi.jpg', '/backdrops/varanasi.jpg', '2026-02-12', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  genre = EXCLUDED.genre,
  duration_minutes = EXCLUDED.duration_minutes,
  rating = EXCLUDED.rating,
  poster_url = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  release_date = EXCLUDED.release_date,
  is_now_showing = EXCLUDED.is_now_showing;

-- Insert showtimes for Spirit (Screen 1 - IMAX)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price) VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-02-05', '10:00:00', 300),
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-02-05', '14:00:00', 300),
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-02-05', '18:00:00', 350),
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-02-05', '22:00:00', 350);

-- Insert showtimes for Spirit (Screen 2 - Dolby Atmos)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price) VALUES
  ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-02-05', '11:00:00', 280),
  ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-02-05', '15:00:00', 280),
  ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-02-05', '19:00:00', 320);

-- Insert showtimes for Varanasi (Screen 2 - Dolby Atmos)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price) VALUES
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-02-12', '09:00:00', 280),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-02-12', '13:00:00', 280),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-02-12', '17:00:00', 320),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-02-12', '21:00:00', 320);

-- Insert showtimes for Varanasi (Screen 3 - Standard)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price) VALUES
  ('20000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '2026-02-12', '10:00:00', 200),
  ('20000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '2026-02-12', '14:00:00', 200),
  ('20000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '2026-02-12', '18:00:00', 250),
  ('20000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '2026-02-12', '22:00:00', 250);
