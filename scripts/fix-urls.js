const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUrls() {
  try {
    // Define movies with correct local paths
    const movies = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        title: 'Spirit',
        poster_url: '/posters/spirit.jpg',
        backdrop_url: '/backdrops/spirit.jpg'
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        title: 'Varanasi',
        poster_url: '/posters/varanasi.jpg',
        backdrop_url: '/backdrops/varanasi.jpg'
      }
    ];

    for (const movie of movies) {
      const { data, error } = await supabase
        .from('movies')
        .update({
          poster_url: movie.poster_url,
          backdrop_url: movie.backdrop_url
        })
        .eq('id', movie.id);

      if (error) {
        console.error(`Error updating ${movie.title}:`, error);
      } else {
        console.log(`✓ Fixed ${movie.title} URL`);
      }
    }

    console.log('\n✓ All URLs fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUrls();
