const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMovies() {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('title, poster_url, backdrop_url')
      .order('title');

    if (error) {
      console.error('Error fetching movies:', error);
    } else {
      console.log('Movies in database:\n');
      data.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title}`);
        console.log(`   Poster: ${movie.poster_url}`);
        console.log(`   Backdrop: ${movie.backdrop_url}\n`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMovies();
