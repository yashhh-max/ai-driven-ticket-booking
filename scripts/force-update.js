const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
// Using service role key which bypasses RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllMovies() {
  try {
    console.log('Attempting direct database updates...\n');

    const updates = [
      { title: 'Spirit', poster: '/posters/spirit.svg', backdrop: '/backdrops/spirit.svg' },
      { title: 'Varanasi', poster: '/posters/varanasi.svg', backdrop: '/backdrops/varanasi.svg' },
      { title: 'Dune: Part Three', poster: '/posters/dune3.svg', backdrop: '/backdrops/dune3.svg' },
      { title: 'Echoes of Tomorrow', poster: '/posters/echoes.svg', backdrop: '/backdrops/echoes.svg' },
      { title: 'Shadow Protocol', poster: '/posters/shadow.svg', backdrop: '/backdrops/shadow.svg' },
      { title: 'The Last Horizon', poster: '/posters/horizon.svg', backdrop: '/backdrops/horizon.svg' },
      { title: 'The Laughing Man', poster: '/posters/laughing.svg', backdrop: '/backdrops/laughing.svg' },
      { title: 'Midnight in Paris 2', poster: '/posters/paris2.svg', backdrop: '/backdrops/paris2.svg' },
    ];

    for (const update of updates) {
      const { data, error } = await supabase
        .from('movies')
        .update({
          poster_url: update.poster,
          backdrop_url: update.backdrop,
        })
        .eq('title', update.title)
        .select();

      if (error) {
        console.log(`✗ ${update.title}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✓ ${update.title} updated`);
      } else {
        console.log(`? ${update.title}: no rows affected`);
      }
    }

    console.log('\n✓ Update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAllMovies();
