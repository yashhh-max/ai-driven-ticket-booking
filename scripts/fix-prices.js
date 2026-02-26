const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg0NDEwNiwiZXhwIjoyMDg1NDIwMTA2fQ.1xGdnXMTbiFRDTfE6OEYyQ02rLt6p7aVR9r2LOqkDh0'
);

async function fixPrices() {
  try {
    console.log('🧹 Deleting all showtimes...');
    const { error: delError } = await supabase
      .from('showtimes')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');
    
    if (delError) {
      console.error('Error deleting:', delError);
      return;
    }
    console.log('✓ All showtimes deleted');

    console.log('📺 Creating new showtimes with prices 250-350...');
    
    // Get all active movies
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, genre')
      .eq('is_now_showing', true);
    
    if (moviesError || !movies) {
      console.error('Error fetching movies:', moviesError);
      return;
    }

    // Get all theaters
    const { data: theaters, error: theatersError } = await supabase
      .from('theaters')
      .select('id, name');
    
    if (theatersError || !theaters) {
      console.error('Error fetching theaters:', theatersError);
      return;
    }

    const showtimes = [];
    const timeSlots = ['10:30', '13:15', '16:00', '19:00', '21:45'];
    
    // Generate showtimes for next 7 days
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const movie of movies) {
        for (const theater of theaters) {
          for (const timeSlot of timeSlots) {
            // Determine price based on theater
            let price = 300; // Default
            if (theater.name.includes('IMAX')) {
              price = 350;
            } else if (theater.name.includes('Dolby')) {
              price = 325;
            } else if (theater.name.includes('Standard')) {
              price = 250;
            }

            // Only add certain genre/theater combinations for realism
            if (
              (theater.name.includes('IMAX') && ['Sci-Fi', 'Action'].includes(movie.genre)) ||
              (theater.name.includes('Dolby') && ['Sci-Fi', 'Action', 'Thriller'].includes(movie.genre)) ||
              theater.name.includes('Standard')
            ) {
              showtimes.push({
                movie_id: movie.id,
                theater_id: theater.id,
                show_date: dateStr,
                show_time: timeSlot,
                price: price,
                is_active: true
              });
            }
          }
        }
      }
    }

    console.log(`Creating ${showtimes.length} showtimes...`);
    
    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < showtimes.length; i += batchSize) {
      const batch = showtimes.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('showtimes')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i}:`, insertError);
        return;
      }
      console.log(`✓ Inserted ${Math.min(batch.length, batchSize)} showtimes`);
    }

    console.log('✅ All prices fixed! Range: 250-350 rupees');
    console.log('  • Standard: ₹250');
    console.log('  • Dolby: ₹325');
    console.log('  • IMAX: ₹350');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPrices();
