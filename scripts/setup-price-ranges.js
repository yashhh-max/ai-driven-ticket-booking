const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function setupPriceRanges() {
  try {
    console.log('🎬 Setup: Regular booking (250-350) + Auto-booking (100-150)\n');
    
    // Get all showtimes
    const { data: allShows } = await supabase
      .from('showtimes')
      .select('id, price, theater_id, movie_id, show_date, show_time, ticket_release_time')
      .limit(10000);
    
    console.log(`Found ${allShows?.length} total showtimes\n`);
    
    // Get theaters for pricing
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    const theaterPrices = {
      regular: {},
      autobook: {}
    };
    
    theaters?.forEach(t => {
      if (t.name.includes('IMAX')) {
        theaterPrices.regular[t.id] = 350;
        theaterPrices.autobook[t.id] = 150;
      } else if (t.name.includes('Dolby')) {
        theaterPrices.regular[t.id] = 325;
        theaterPrices.autobook[t.id] = 130;
      } else {
        theaterPrices.regular[t.id] = 250;
        theaterPrices.autobook[t.id] = 100;
      }
    });
    
    console.log('Theater Pricing:');
    console.log('  Regular Booking:');
    console.log('    IMAX: ₹350');
    console.log('    Dolby: ₹325');
    console.log('    Standard: ₹250');
    console.log('  Auto-Book:');
    console.log('    IMAX: ₹150');
    console.log('    Dolby: ₹130');
    console.log('    Standard: ₹100\n');
    
    // Update regular showtimes to 250-350
    console.log('🔧 Step 1: Updating regular booking prices (250-350)...');
    let regularUpdated = 0;
    
    for (const st of allShows || []) {
      // Regular booking has no release time or release time in the past
      if (!st.ticket_release_time || new Date(st.ticket_release_time) <= new Date()) {
        const newPrice = theaterPrices.regular[st.theater_id];
        const { error } = await supabase
          .from('showtimes')
          .update({ price: newPrice })
          .eq('id', st.id);
        
        if (!error) regularUpdated++;
      }
    }
    
    console.log(`✓ Updated ${regularUpdated} regular showtimes\n`);
    
    // Create auto-booking showtimes with 100-150 pricing
    console.log('🔧 Step 2: Creating auto-booking showtimes (100-150)...');
    
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title')
      .eq('is_now_showing', true);
    
    const autoBookShowtimes = [];
    
    // Create auto-booking showtimes for next 7 days
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      
      // Release times: 24 hours before each showtime
      const showTimes = ['10:30', '13:15', '16:00', '19:00', '21:45'];
      
      for (const movie of movies || []) {
        for (const theater of theaters || []) {
          for (const time of showTimes) {
            // Calculate release time (24 hours before show)
            const showDateTime = new Date(`${dateStr}T${time}`);
            const releaseTime = new Date(showDateTime.getTime() - 24 * 60 * 60 * 1000);
            
            autoBookShowtimes.push({
              movie_id: movie.id,
              theater_id: theater.id,
              show_date: dateStr,
              show_time: time,
              price: theaterPrices.autobook[theater.id],
              is_active: true,
              ticket_release_time: releaseTime.toISOString()
            });
          }
        }
      }
    }
    
    console.log(`Creating ${autoBookShowtimes.length} auto-booking showtimes...`);
    
    // Batch insert
    const batchSize = 100;
    let autobookInserted = 0;
    let autobookErrors = 0;
    
    for (let i = 0; i < autoBookShowtimes.length; i += batchSize) {
      const batch = autoBookShowtimes.slice(i, i + batchSize);
      const { error } = await supabase.from('showtimes').insert(batch);
      
      if (error) {
        autobookErrors += batch.length;
      } else {
        autobookInserted += batch.length;
      }
    }
    
    console.log(`✓ Inserted ${autobookInserted} auto-booking showtimes`);
    if (autobookErrors > 0) console.log(`⚠️  Failed: ${autobookErrors}\n`);
    
    // Verify prices
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price, ticket_release_time')
      .limit(10000);
    
    const priceGroups = {};
    verify?.forEach(st => {
      const type = st.ticket_release_time ? 'Auto-Book' : 'Regular';
      const key = `${type}: ₹${st.price}`;
      priceGroups[key] = (priceGroups[key] || 0) + 1;
    });
    
    console.log('📊 Final Price Distribution:\n');
    console.log('Regular Booking:');
    Object.keys(priceGroups).filter(k => k.includes('Regular')).sort().forEach(key => {
      console.log(`  ${key}: ${priceGroups[key]}`);
    });
    
    console.log('\nAuto-Booking:');
    Object.keys(priceGroups).filter(k => k.includes('Auto')).sort().forEach(key => {
      console.log(`  ${key}: ${priceGroups[key]}`);
    });
    
    console.log(`\n✅ Total showtimes: ${verify?.length || 0}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupPriceRanges();
