const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function fixAllMoviePrices() {
  try {
    console.log('🔍 Analyzing current showtimes...\n');
    
    // Get all showtimes with movie and theater info
    const { data: allShows } = await supabase
      .from('showtimes')
      .select('id, price, theater_id, movie_id')
      .limit(10000);
    
    // Get theaters
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    const theaterPrices = {};
    theaters?.forEach(t => {
      if (t.name.includes('IMAX')) theaterPrices[t.id] = 350;
      else if (t.name.includes('Dolby')) theaterPrices[t.id] = 325;
      else theaterPrices[t.id] = 250;
    });
    
    // Get all active movies
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title');
    
    console.log(`Movies found: ${movies?.length}`);
    console.log(`Current showtimes: ${allShows?.length}\n`);
    
    console.log('Showtimes per movie (before):\n');
    const movieGroups = {};
    allShows?.forEach(st => {
      movieGroups[st.movie_id] = (movieGroups[st.movie_id] || 0) + 1;
    });
    
    movies?.forEach(m => {
      console.log(`  ${m.title}: ${movieGroups[m.id] || 0}`);
    });
    
    // Now fix prices for ALL existing showtimes
    console.log('\n🔧 Updating all showtime prices...\n');
    
    let updated = 0;
    for (const st of allShows || []) {
      const newPrice = theaterPrices[st.theater_id];
      const { error } = await supabase
        .from('showtimes')
        .update({ price: newPrice })
        .eq('id', st.id);
      
      if (!error) updated++;
    }
    
    console.log(`✓ Updated ${updated} showtimes to correct prices`);
    
    // Verify
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price')
      .order('price');
    
    const groupByPrice = {};
    verify?.forEach(st => {
      groupByPrice[st.price] = (groupByPrice[st.price] || 0) + 1;
    });
    
    console.log('\n📊 Final prices:');
    Object.entries(groupByPrice).sort((a, b) => a[0] - b[0]).forEach(([price, count]) => {
      console.log(`  ₹${price}: ${count}`);
    });
    
    const prices = Object.keys(groupByPrice).map(Number).sort((a, b) => a - b);
    console.log(`\n✅ Price range: ₹${Math.min(...prices)} - ₹${Math.max(...prices)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAllMoviePrices();
