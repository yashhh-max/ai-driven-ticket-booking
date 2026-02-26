const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function cleanAndReset() {
  try {
    console.log('Analyzing current data...\n');
    
    // Get price distribution
    const { data: priceStats } = await supabase
      .from('showtimes')
      .select('price, theater_id, id')
      .order('price');
    
    console.log('Current prices distribution:');
    const grouped = {};
    priceStats?.forEach(st => {
      grouped[st.price] = (grouped[st.price] || 0) + 1;
    });
    
    Object.entries(grouped).sort((a, b) => a[0] - b[0]).forEach(([price, count]) => {
      console.log(`  ₹${price}: ${count} showtimes`);
    });
    
    // Get sample of old prices to see their theaters
    console.log('\nSample of showtimes with prices < 100:');
    const { data: oldPrices } = await supabase
      .from('showtimes')
      .select('id, price, theater_id, show_date, show_time')
      .lt('price', 100)
      .limit(5);
    
    oldPrices?.forEach(st => {
      console.log(`  ID: ${st.id.substring(0, 8)}... Price: ₹${st.price}, Theater: ${st.theater_id.substring(0, 8)}...`);
    });
    
    // Get theaters
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    console.log('\nTheaters:');
    theaters?.forEach(t => {
      console.log(`  ${t.id.substring(0, 8)}... = ${t.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanAndReset();
