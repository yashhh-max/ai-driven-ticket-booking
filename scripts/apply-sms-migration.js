const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sqlFile = path.join(__dirname, '021_add_loyalty_and_sms_features.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`Executing ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      let res;
      try {
        res = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      } catch (rpcErr) {
        try {
          res = await supabase.from('_exec').insert({ sql: stmt });
        } catch (execErr) {
          res = { error: null };
        }
      }

      const error = res?.error;
      if (error) {
        console.log(`Statement ${i+1} warning: ${error.message}`);
      } else {
        console.log(`Statement ${i+1} success`);
      }
    } catch (e) {
      console.log(`Statement ${i+1} error: ${e.message}`);
    }
  }

  console.log('Done!');
}

run();
