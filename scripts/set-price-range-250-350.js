#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setPriceRange() {
  try {
    console.log('💰 Updating all ticket prices to 250-350 range...\n');

    // Define price mapping for different theater types
    const priceMap = {
      'IMAX': 350,          // Premium theater - highest price
      'Dolby Atmos': 320,   // Mid-tier theater
      'Standard': 250       // Standard theater - lowest price
    };

    // Fetch all showtimes with theater info
    const { data: showtimes, error: fetchError } = await supabase
      .from('showtimes')
      .select(`
        id,
        theater:theaters(name)
      `);

    if (fetchError) {
      console.error('❌ Error fetching showtimes:', fetchError.message);
      return;
    }

    console.log(`Found ${showtimes.length} showtimes to update\n`);

    let imax = 0, dolby = 0, standard = 0;

    // Update each showtime with appropriate price
    for (const showtime of showtimes) {
      const theaterName = showtime.theater.name;
      let newPrice = 250; // default

      if (theaterName.includes('IMAX')) {
        newPrice = 350;
        imax++;
      } else if (theaterName.includes('Dolby')) {
        newPrice = 320;
        dolby++;
      } else {
        newPrice = 250;
        standard++;
      }

      const { error } = await supabase
        .from('showtimes')
        .update({ price: newPrice })
        .eq('id', showtime.id);

      if (error) {
        console.error(`❌ Error updating showtime ${showtime.id}:`, error.message);
      }
    }

    console.log('✅ Price Update Summary:\n');
    console.log(`📺 IMAX Theaters (₹350):          ${imax} showtimes`);
    console.log(`🔊 Dolby Atmos Theaters (₹320):  ${dolby} showtimes`);
    console.log(`🎬 Standard Theaters (₹250):     ${standard} showtimes`);
    console.log(`\n📊 Total updated: ${imax + dolby + standard} showtimes`);
    console.log(`\n✨ All prices are now between ₹250 - ₹350`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

setPriceRange();
