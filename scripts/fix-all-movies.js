const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllMovies() {
  try {
    // First, get all movies to see their IDs
    const { data: allMovies, error: fetchError } = await supabase
      .from('movies')
      .select('id, title')
      .order('title');

    if (fetchError) {
      console.error('Error fetching movies:', fetchError);
      process.exit(1);
    }

    console.log('Movies in database:');
    allMovies.forEach((m, i) => {
      console.log(`${i + 1}. ${m.title} - ID: ${m.id}`);
    });

    // Map movies to their correct local paths
    const movieUpdates = [
      { title: 'Dune: Part Three', poster: '/posters/dune3.svg', backdrop: '/backdrops/dune3.svg' },
      { title: 'Echoes of Tomorrow', poster: '/posters/echoes.svg', backdrop: '/backdrops/echoes.svg' },
      { title: 'Midnight in Paris 2', poster: '/posters/paris2.svg', backdrop: '/backdrops/paris2.svg' },
      { title: 'Shadow Protocol', poster: '/posters/shadow.svg', backdrop: '/backdrops/shadow.svg' },
      { title: 'Spirit', poster: '/posters/spirit.svg', backdrop: '/backdrops/spirit.svg' },
      { title: 'The Laughing Man', poster: '/posters/laughing.svg', backdrop: '/backdrops/laughing.svg' },
      { title: 'The Last Horizon', poster: '/posters/horizon.svg', backdrop: '/backdrops/horizon.svg' },
      { title: 'Varanasi', poster: '/posters/varanasi.svg', backdrop: '/backdrops/varanasi.svg' },
    ];

    console.log('\nUpdating all movies...\n');

    for (const update of movieUpdates) {
      const movie = allMovies.find(m => m.title === update.title);
      if (!movie) {
        console.log(`⚠ ${update.title} not found in database`);
        continue;
      }

      const { error } = await supabase
        .from('movies')
        .update({
          poster_url: update.poster,
          backdrop_url: update.backdrop,
        })
        .eq('id', movie.id);

      if (error) {
        console.log(`✗ Error updating ${update.title}: ${error.message}`);
      } else {
        console.log(`✓ Updated ${update.title}`);
      }
    }

    console.log('\n✓ All movies updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllMovies();
