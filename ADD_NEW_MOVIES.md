# How to Add the New Movies to Supabase

## New Movies Added:
1. **Spirit** - Starring Prabhas (Action thriller, Feb 5, 2026)
2. **Varanasi** - Starring Mahesh Babu (Drama, Feb 12, 2026)

## Steps to Add These Movies to Your Supabase Database:

1. **Open Supabase Console**
   - Go to https://app.supabase.com
   - Select your project

2. **Run the Migration Script**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy the contents of `scripts/006_add_telugu_movies.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

3. **Verify the Movies**
   - Go to the "Movies" table in the database
   - You should see the two new movies added
   - Their showtimes should also be visible in the "Showtimes" table

4. **Check the Images**
   - The poster and backdrop images are already created in:
     - `/public/posters/spirit.jpg` and `varanasi.jpg`
     - `/public/backdrops/spirit.jpg` and `varanasi.jpg`
   - These are SVG placeholders - you can replace them with actual images later

5. **Refresh Your App**
   - The new movies should now appear on the home page
   - Users can select showtimes and book tickets

## Database Schema:
- **Movies Table**: Stores movie details (title, description, genre, poster_url, etc.)
- **Showtimes Table**: Stores show times for each movie in each theater
- **Theaters Table**: Already has 3 screens set up

The new movies are marked as `is_now_showing = true` so they'll appear in the "Now Showing" section immediately.
