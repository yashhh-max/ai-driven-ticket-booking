const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUrls() {
  try {
    const movies = [
      { id: '10000000-0000-0000-0000-000000000001', poster: '/posters/spirit.svg', backdrop: '/backdrops/spirit.svg' },
      { id: '20000000-0000-0000-0000-000000000002', poster: '/posters/varanasi.svg', backdrop: '/backdrops/varanasi.svg' },
      { id: '00000000-0000-0000-0000-000000000003', poster: '/posters/dune3.svg', backdrop: '/backdrops/dune3.svg' },
      { id: '00000000-0000-0000-0000-000000000004', poster: '/posters/echoes.svg', backdrop: '/backdrops/echoes.svg' },
      { id: '00000000-0000-0000-0000-000000000005', poster: '/posters/shadow.svg', backdrop: '/backdrops/shadow.svg' },
      { id: '00000000-0000-0000-0000-000000000006', poster: '/posters/horizon.svg', backdrop: '/backdrops/horizon.svg' },
      { id: '00000000-0000-0000-0000-000000000007', poster: '/posters/laughing.svg', backdrop: '/backdrops/laughing.svg' },
      { id: '00000000-0000-0000-0000-000000000008', poster: '/posters/paris2.svg', backdrop: '/backdrops/paris2.svg' },
    ];

    for (const movie of movies) {
      const { error } = await supabase
        .from('movies')
        .update({
          poster_url: movie.poster,
          backdrop_url: movie.backdrop,
        })
        .eq('id', movie.id);

      if (error) {
        console.log(`Note: ${movie.id} - ${error.message}`);
      } else {
        console.log(`✓ Updated movie ${movie.id}`);
      }
    }

    console.log('\n✓ URLs updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUrls();
