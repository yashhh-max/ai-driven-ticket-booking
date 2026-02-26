const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://gyhabxcmtlueunljqzwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDQxMDYsImV4cCI6MjA4NTQyMDEwNn0.uApdeKtadRICSxN4W-jUfhNnEbYqF4G2AzohlMWuqOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFunction() {
  try {
    // Read the updated SQL function
    const sqlContent = fs.readFileSync('./scripts/004_create_prebooking_system.sql', 'utf8');
    
    // Extract just the process_pre_booking function
    const functionMatch = sqlContent.match(/CREATE OR REPLACE FUNCTION process_pre_booking[\s\S]*?END;\s*\$\$;/);
    
    if (!functionMatch) {
      console.error('Could not find function in SQL file');
      process.exit(1);
    }

    const functionSQL = functionMatch[0];
    
    // Execute the function update via raw SQL
    const { error } = await supabase.rpc('execute_raw_sql', { sql_text: functionSQL }, { 
      headers: { 'Authorization': `Bearer ${supabaseKey}` } 
    });

    if (error) {
      // Try alternative approach - execute via direct query
      console.log('Attempting direct update...');
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: functionSQL })
      });

      if (!response.ok) {
        throw new Error(`Failed to update function: ${response.statusText}`);
      }

      console.log('✓ Function updated successfully');
    } else {
      console.log('✓ Function updated successfully');
    }
  } catch (error) {
    console.error('Error updating function:', error.message);
    process.exit(1);
  }
}

updateFunction();
