const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function fixPrices() {
  try {
    console.log('🔧 Fixing all prices to 250-350 range...\n');
    
    // Get ALL showtimes with their theater info
    const { data: showtimes } = await supabase
      .from('showtimes')
      .select('id, price, theater_id')
      .limit(10000);
    
    console.log(`Fetched ${showtimes?.length} showtimes`);
    
    // Get theaters
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    // Create price map
    const theaterPriceMap = {};
    theaters?.forEach(t => {
      if (t.name.includes('IMAX')) theaterPriceMap[t.id] = 350;
      else if (t.name.includes('Dolby')) theaterPriceMap[t.id] = 325;
      else theaterPriceMap[t.id] = 250;
    });
    
    // Update all showtimes
    let updated = 0;
    let errors = 0;
    
    for (const st of showtimes || []) {
      const newPrice = theaterPriceMap[st.theater_id];
      const { error } = await supabase
        .from('showtimes')
        .update({ price: newPrice })
        .eq('id', st.id);
      
      if (error) {
        errors++;
        if (errors <= 3) console.error(`  Error updating ${st.id}:`, error.message);
      } else {
        updated++;
      }
    }
    
    console.log(`\n✓ Updated: ${updated}`);
    console.log(`✗ Errors: ${errors}`);
    
    // Verify
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price')
      .order('price');
    
    const uniquePrices = [...new Set(verify?.map(s => s.price) || [])].sort((a, b) => a - b);
    
    console.log('\n📊 Final prices:');
    const grouped = {};
    verify?.forEach(st => {
      grouped[st.price] = (grouped[st.price] || 0) + 1;
    });
    
    Object.entries(grouped).sort((a, b) => a[0] - b[0]).forEach(([price, count]) => {
      console.log(`  ₹${price}: ${count} showtimes`);
    });
    
    const min = Math.min(...uniquePrices);
    const max = Math.max(...uniquePrices);
    console.log(`\n✅ Price range: ₹${min} - ₹${max}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPrices();
