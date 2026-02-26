const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function deleteAndRecreate() {
  try {
    console.log('🗑️  Deleting old test data with prices < 100...');
    
    // Delete all showtimes with price < 100 (these are test data)
    let deleted = 0;
    const { data: oldST } = await supabase
      .from('showtimes')
      .select('id')
      .lt('price', 100);
    
    console.log(`Found ${oldST?.length} old showtimes to delete`);
    
    for (const st of oldST || []) {
      const { error } = await supabase
        .from('showtimes')
        .delete()
        .eq('id', st.id);
      
      if (!error) deleted++;
    }
    
    console.log(`✓ Deleted ${deleted} old showtimes`);
    
    // Now verify remaining prices
    const { data: remaining } = await supabase
      .from('showtimes')
      .select('price')
      .order('price');
    
    const uniquePrices = [...new Set(remaining?.map(s => s.price) || [])].sort((a, b) => a - b);
    console.log(`\n✅ Clean! Remaining prices: ${uniquePrices.join(', ')}`);
    console.log(`Range: ₹${Math.min(...uniquePrices)} - ₹${Math.max(...uniquePrices)}`);
    console.log(`Total showtimes: ${remaining?.length || 0}`);
    
    // Price breakdown
    const grouped = {};
    remaining?.forEach(st => {
      grouped[st.price] = (grouped[st.price] || 0) + 1;
    });
    
    console.log('\nPrice breakdown:');
    Object.entries(grouped).sort((a, b) => a[0] - b[0]).forEach(([price, count]) => {
      console.log(`  ₹${price}: ${count} showtimes`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAndRecreate();
