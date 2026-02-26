const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function regenerateShowtimes() {
  try {
    console.log('🗑️  Step 1: Deleting all existing showtimes...\n');
    
    // Get all showtimes
    const { data: allST } = await supabase
      .from('showtimes')
      .select('id')
      .limit(10000);
    
    let deletedCount = 0;
    for (const st of allST || []) {
      await supabase.from('showtimes').delete().eq('id', st.id);
      deletedCount++;
    }
    
    console.log(`✓ Deleted ${deletedCount} showtimes\n`);
    
    console.log('📺 Step 2: Fetching movies and theaters...');
    
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title, genre')
      .eq('is_now_showing', true);
    
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    console.log(`✓ Found ${movies?.length} active movies`);
    console.log(`✓ Found ${theaters?.length} theaters\n`);
    
    console.log('🎬 Step 3: Creating showtimes for ALL movies on ALL screens...\n');
    
    // Create price map
    const theaterPrices = {};
    theaters?.forEach(t => {
      if (t.name.includes('IMAX')) theaterPrices[t.id] = 350;
      else if (t.name.includes('Dolby')) theaterPrices[t.id] = 325;
      else theaterPrices[t.id] = 250;
    });
    
    const showtimes = [];
    const timeSlots = ['10:30', '13:15', '16:00', '19:00', '21:45'];
    
    // Generate for next 7 days
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const movie of movies || []) {
        for (const theater of theaters || []) {
          for (const time of timeSlots) {
            showtimes.push({
              movie_id: movie.id,
              theater_id: theater.id,
              show_date: dateStr,
              show_time: time,
              price: theaterPrices[theater.id],
              is_active: true
            });
          }
        }
      }
    }
    
    console.log(`Creating ${showtimes.length} showtimes...\n`);
    
    // Batch insert
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < showtimes.length; i += batchSize) {
      const batch = showtimes.slice(i, i + batchSize);
      const { error } = await supabase.from('showtimes').insert(batch);
      
      if (error) {
        errors += batch.length;
        console.log(`⚠️  Batch ${Math.floor(i/batchSize)+1}: Error - ${error.message}`);
      } else {
        inserted += batch.length;
        console.log(`✓ Batch ${Math.floor(i/batchSize)+1}: Inserted ${batch.length} showtimes`);
      }
    }
    
    console.log(`\n✅ Inserted: ${inserted}`);
    if (errors > 0) console.log(`⚠️  Errors: ${errors}`);
    
    // Verify
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price, movie_id, theater_id')
      .order('price');
    
    const groupByPrice = {};
    verify?.forEach(st => {
      groupByPrice[st.price] = (groupByPrice[st.price] || 0) + 1;
    });
    
    console.log('\n📊 Final showtimes by price:');
    Object.entries(groupByPrice).sort((a, b) => a[0] - b[0]).forEach(([price, count]) => {
      console.log(`  ₹${price}: ${count} showtimes`);
    });
    
    const prices = Object.keys(groupByPrice).map(Number).sort((a, b) => a - b);
    console.log(`\n✅ Price range: ₹${Math.min(...prices)} - ₹${Math.max(...prices)}`);
    console.log(`Total showtimes: ${verify?.length || 0}`);
    
    // Show sample
    console.log('\n📝 Sample movies with showtimes:');
    const movieCounts = {};
    verify?.forEach(st => {
      movieCounts[st.movie_id] = (movieCounts[st.movie_id] || 0) + 1;
    });
    
    const sampleMovies = movies?.slice(0, 3) || [];
    sampleMovies.forEach(m => {
      console.log(`  ${m.title}: ${movieCounts[m.id] || 0} showtimes`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

regenerateShowtimes();
