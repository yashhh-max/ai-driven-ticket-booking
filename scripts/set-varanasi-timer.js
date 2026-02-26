#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setVariansiReleaseTime() {
  try {
    console.log('⏱️  Resetting Spirit and setting Varanasi auto-booking timer to 3 minutes...\n');

    // First, reset Spirit to a far future date
    const { data: spiritMovie } = await supabase
      .from('movies')
      .select('id, title')
      .eq('title', 'Spirit')
      .single();

    if (spiritMovie) {
      const { data: spiritShowtimes } = await supabase
        .from('showtimes')
        .select('id')
        .eq('movie_id', spiritMovie.id)
        .order('show_date', { ascending: true })
        .limit(1);

      if (spiritShowtimes && spiritShowtimes.length > 0) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days in future
        
        await supabase
          .from('showtimes')
          .update({ ticket_release_time: futureDate.toISOString() })
          .eq('id', spiritShowtimes[0].id);

        console.log('✅ Reset Spirit movie release time to 30 days in future\n');
      }
    }

    // Now set Varanasi to 3 minutes from now
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, title')
      .eq('title', 'Varanasi')
      .single();

    if (movieError || !movie) {
      console.error('❌ Could not find Varanasi movie');
      return;
    }

    console.log(`Found movie: ${movie.title}`);

    // Calculate release time as 3 minutes from now
    const now = new Date();
    const releaseTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes from now
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Release time: ${releaseTime.toISOString()} (in 3 minutes)`);

    // Update the first showtime for this movie with the new release time
    const { data: showtimes, error: showtimeError } = await supabase
      .from('showtimes')
      .select('id, show_date, show_time')
      .eq('movie_id', movie.id)
      .order('show_date', { ascending: true })
      .limit(1);

    if (showtimeError || !showtimes || showtimes.length === 0) {
      console.error('❌ Could not find showtimes for this movie');
      return;
    }

    const showtime = showtimes[0];
    console.log(`\nUpdating showtime: ${showtime.show_date} at ${showtime.show_time}`);

    // Update the showtime with new ticket_release_time
    const { data, error } = await supabase
      .from('showtimes')
      .update({ 
        ticket_release_time: releaseTime.toISOString()
      })
      .eq('id', showtime.id)
      .select();

    if (error) {
      console.error('❌ Error updating showtime:', error.message);
      return;
    }

    console.log('✅ Successfully set Varanasi ticket release time!\n');
    console.log(`📝 Test Instructions:`);
    console.log(`1. Go to Auto-Book page`);
    console.log(`2. Pre-book "Varanasi" movie for ${showtime.show_date} at ${showtime.show_time}`);
    console.log(`3. The auto-booking will trigger in 3 minutes`);
    console.log(`4. You should see the status change from "Queued" → "Processing" → "Completed"`);
    console.log(`\n⏰ Release time: ${releaseTime.toLocaleTimeString()}`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

setVariansiReleaseTime();
