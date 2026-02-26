const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function quickCheck() {
  const { data: shows } = await supabase
    .from('showtimes')
    .select('id, price')
    .limit(5);
  
  console.log('Sample showtimes:');
  shows?.forEach((s, i) => {
    console.log(`  ${i+1}. ₹${s.price}`);
  });
  
  const { data: allPrices } = await supabase
    .from('showtimes')
    .select('price')
    .order('price');
  
  const unique = [...new Set(allPrices?.map(p => p.price) || [])].sort((a, b) => a - b);
  console.log(`\nUnique prices: ${unique.join(', ')}`);
}

quickCheck();
