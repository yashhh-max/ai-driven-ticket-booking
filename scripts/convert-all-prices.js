const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function convertAllPrices() {
  try {
    console.log('🔄 Converting all prices to 250-350 (regular) or 100-150 (auto-book)\n');
    
    const { data: allShows } = await supabase
      .from('showtimes')
      .select('id, price, theater_id, ticket_release_time')
      .limit(10000);
    
    console.log(`Processing ${allShows?.length} showtimes...\n`);
    
    // Get theaters
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
    
    let updated = 0;
    let errors = 0;
    
    for (const st of allShows || []) {
      // Determine if this is auto-book or regular
      // If has ticket_release_time and it's in future, it's auto-book
      const isAutoBook = st.ticket_release_time && new Date(st.ticket_release_time) > new Date();
      
      const newPrice = isAutoBook 
        ? theaterPrices.autobook[st.theater_id] 
        : theaterPrices.regular[st.theater_id];
      
      const { error } = await supabase
        .from('showtimes')
        .update({ price: newPrice })
        .eq('id', st.id);
      
      if (error) {
        errors++;
      } else {
        updated++;
      }
    }
    
    console.log(`✓ Updated: ${updated}`);
    if (errors > 0) console.log(`✗ Errors: ${errors}\n`);
    
    // Verify
    const { data: verify } = await supabase
      .from('showtimes')
      .select('price, ticket_release_time')
      .limit(10000);
    
    const regularPrices = new Set();
    const autobookPrices = new Set();
    
    verify?.forEach(st => {
      const isAutoBook = st.ticket_release_time && new Date(st.ticket_release_time) > new Date();
      if (isAutoBook) {
        autobookPrices.add(st.price);
      } else {
        regularPrices.add(st.price);
      }
    });
    
    console.log('📊 Final Price Distribution:\n');
    
    console.log('Regular Booking (250-350):');
    Array.from(regularPrices).sort((a, b) => a - b).forEach(p => {
      const count = verify?.filter(s => !s.ticket_release_time || new Date(s.ticket_release_time) <= new Date()).filter(s => s.price === p).length || 0;
      console.log(`  ₹${p}: ${count} showtimes`);
    });
    
    console.log('\nAuto-Booking (100-150):');
    Array.from(autobookPrices).sort((a, b) => a - b).forEach(p => {
      const count = verify?.filter(s => s.ticket_release_time && new Date(s.ticket_release_time) > new Date()).filter(s => s.price === p).length || 0;
      console.log(`  ₹${p}: ${count} showtimes`);
    });
    
    console.log(`\n✅ All prices converted!`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

convertAllPrices();
