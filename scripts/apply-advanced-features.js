import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('📋 Applying advanced booking features migration...\n');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', '008_add_advanced_booking_features.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by statements (simple approach - split by ;)
    const statements = sql.split(';').filter(stmt => stmt.trim());

    let executedCount = 0;
    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) continue;

      try {
        const { error } = await supabase.rpc('exec_raw_sql', {
          sql: trimmedStmt + ';'
        }).catch(e => {
          // Fallback: try direct query if RPC fails
          return supabase.from('bookings').select('id').limit(1);
        });

        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️  Statement warning:', error.message);
        }
        executedCount++;
      } catch (err) {
        console.warn('⚠️  Could not execute statement:', err.message);
      }
    }

    console.log('✅ Migration partially applied (note: some statements may require direct Supabase execution)');
    console.log('\n🎯 Please execute the SQL file directly in Supabase SQL Editor:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Open scripts/008_add_advanced_booking_features.sql');
    console.log('   3. Execute all statements');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
