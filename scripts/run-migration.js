const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Insert Spirit movie
    const { data: spirit, error: spiritError } = await supabase
      .from('movies')
      .upsert({
        id: '10000000-0000-0000-0000-000000000001',
        title: 'Spirit',
        description: 'A high-octane action thriller starring Prabhas. An elite operative is drawn into a dangerous mission that will test his skills and loyalty.',
        genre: 'Action',
        duration_minutes: 148,
        rating: 'UA',
        poster_url: '/posters/spirit.jpg',
        backdrop_url: '/backdrops/spirit.jpg',
        release_date: '2026-02-05',
        is_now_showing: true
      });

    if (spiritError) {
      console.error('Error inserting Spirit:', spiritError);
    } else {
      console.log('✓ Spirit movie added/updated');
    }

    // Insert Varanasi movie
    const { data: varanasi, error: varanasError } = await supabase
      .from('movies')
      .upsert({
        id: '20000000-0000-0000-0000-000000000002',
        title: 'Varanasi',
        description: 'An epic drama starring Mahesh Babu set against the backdrop of the holy city. A journey of redemption and spiritual awakening.',
        genre: 'Drama',
        duration_minutes: 156,
        rating: 'UA',
        poster_url: '/posters/varanasi.jpg',
        backdrop_url: '/backdrops/varanasi.jpg',
        release_date: '2026-02-12',
        is_now_showing: true
      });

    if (varanasError) {
      console.error('Error inserting Varanasi:', varanasError);
    } else {
      console.log('✓ Varanasi movie added/updated');
    }

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
