const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMovies() {
  try {
    // Fetch all movies
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error fetching movies:', error);
    } else {
      console.log('Total movies in database:', data.length);
      console.log('\nMovies:');
      data.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} - ${movie.poster_url}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMovies();
