const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function updateAllPrices() {
  try {
    console.log('📊 Fetching all showtimes...');
    
    // Fetch ALL showtimes without any filter
    const { data: showtimes, error: fetchError } = await supabase
      .from('showtimes')
      .select('id, theater_id, movie_id')
      .limit(1000);
    
    if (fetchError) {
      console.error('Error fetching:', fetchError);
      return;
    }
    
    console.log(`Found ${showtimes.length} showtimes`);
    
    // Get theaters to determine prices
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    const theaterPrices = {};
    theaters?.forEach(t => {
      if (t.name.includes('IMAX')) theaterPrices[t.id] = 350;
      else if (t.name.includes('Dolby')) theaterPrices[t.id] = 325;
      else theaterPrices[t.id] = 250;
    });
    
    console.log('\nTheater prices:');
    Object.entries(theaterPrices).forEach(([id, price]) => {
      const theater = theaters?.find(t => t.id === id);
      console.log(`  ${theater?.name}: ₹${price}`);
    });
    
    // Update each showtime
    let updated = 0;
    let errors = 0;
    
    console.log(`\nUpdating ${showtimes.length} showtimes...`);
    
    for (const showtime of showtimes) {
      const newPrice = theaterPrices[showtime.theater_id];
      const { error } = await supabase
        .from('showtimes')
        .update({ price: newPrice })
        .eq('id', showtime.id);
      
      if (error) {
        errors++;
      } else {
        updated++;
      }
      
      if ((updated + errors) % 100 === 0) {
        console.log(`  Progress: ${updated + errors}/${showtimes.length}`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} showtimes`);
    if (errors > 0) console.log(`⚠️  Failed: ${errors}`);
    
    // Verify
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price')
      .order('price');
    
    const uniquePrices = [...new Set(verify?.map(s => s.price) || [])].sort((a, b) => a - b);
    console.log(`\n📊 All prices now: ${uniquePrices.join(', ')}`);
    console.log(`Range: ₹${Math.min(...uniquePrices)} - ₹${Math.max(...uniquePrices)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAllPrices();
