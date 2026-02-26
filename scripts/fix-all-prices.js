const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://gyhabxcmtlueunljqzwo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI'
);

async function fixAllPrices() {
  try {
    const sql = fs.readFileSync('./scripts/999_fix_all_prices.sql', 'utf-8');
    
    console.log('🔄 Executing SQL to fix prices...\n');
    
    // Delete old showtimes
    console.log('Deleting old showtimes...');
    const { error: delError, data: delData } = await supabase.rpc('exec_sql', { sql: 'DELETE FROM showtimes' });
    if (delError) console.log('Delete result:', delData || delError);
    else console.log('✓ Old showtimes deleted');
    
    // Get movies and theaters
    console.log('\nFetching active movies and theaters...');
    const { data: movies } = await supabase
      .from('movies')
      .select('id, genre, title')
      .eq('is_now_showing', true);
    
    const { data: theaters } = await supabase
      .from('theaters')
      .select('id, name');
    
    console.log(`Found ${movies?.length || 0} active movies`);
    console.log(`Found ${theaters?.length || 0} theaters`);
    
    // Create showtimes
    console.log('\nCreating new showtimes with prices 250-350...');
    
    const showtimes = [];
    const timeSlots = ['10:30', '13:15', '16:00', '19:00', '21:45'];
    
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const movie of movies || []) {
        for (const theater of theaters || []) {
          for (const time of timeSlots) {
            let price = 250;
            if (theater.name.includes('IMAX')) price = 350;
            else if (theater.name.includes('Dolby')) price = 325;
            
            // Show various genres in different screens
            const isIMAX = theater.name.includes('IMAX');
            const isDolby = theater.name.includes('Dolby');
            const isStandard = theater.name.includes('Standard');
            
            const shouldAdd = 
              (isIMAX && ['Sci-Fi', 'Action', 'Thriller'].includes(movie.genre)) ||
              (isDolby && ['Sci-Fi', 'Action', 'Thriller', 'Drama', 'Comedy'].includes(movie.genre)) ||
              isStandard;
            
            if (shouldAdd) {
              showtimes.push({
                movie_id: movie.id,
                theater_id: theater.id,
                show_date: dateStr,
                show_time: time,
                price: price,
                is_active: true
              });
            }
          }
        }
      }
    }
    
    console.log(`Creating ${showtimes.length} showtimes...`);
    
    // Batch insert
    const batchSize = 100;
    for (let i = 0; i < showtimes.length; i += batchSize) {
      const batch = showtimes.slice(i, i + batchSize);
      const { error } = await supabase.from('showtimes').insert(batch);
      
      if (error) {
        console.error(`Error inserting batch at ${i}:`, error);
      } else {
        console.log(`✓ Inserted ${batch.length} showtimes`);
      }
    }
    
    // Verify
    const { data: allPrices, error: verifyError } = await supabase
      .from('showtimes')
      .select('price')
      .order('price');
    
    if (!verifyError && allPrices) {
      const uniquePrices = [...new Set(allPrices.map(s => s.price))].sort((a, b) => a - b);
      console.log('\n✅ All prices fixed!');
      console.log(`📊 Price range: ₹${Math.min(...uniquePrices)} - ₹${Math.max(...uniquePrices)}`);
      console.log(`Unique prices: ${uniquePrices.join(', ')}`);
      console.log(`Total showtimes: ${allPrices.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAllPrices();
