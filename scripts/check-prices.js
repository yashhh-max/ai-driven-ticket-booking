const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fixPrices() {
  const url = 'https://gyhabxcmtlueunljqzwo.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';
  
  try {
    // Get all showtimes
    console.log('Fetching showtimes...');
    const res = await fetch(`${url}/rest/v1/showtimes`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const showtimes = await res.json();
    console.log(`Found ${showtimes.length} showtimes`);
    
    // Just log first few
    console.log('\nFirst 5 showtimes:');
    showtimes.slice(0, 5).forEach((st, i) => {
      console.log(`${i+1}. Price: ${st.price}, Theater: ${st.theater_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixPrices();
