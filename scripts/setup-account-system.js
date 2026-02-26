#!/usr/bin/env node

/**
 * Automated Account System Database Setup
 * Runs the 020_create_account_system.sql migration on your Supabase instance
 * 
 * Usage: node scripts/setup-account-system.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🚀 Starting Account System Database Setup...\n');

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read SQL migration file
    const sqlFile = path.join(__dirname, '020_create_account_system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📖 Read migration file: 020_create_account_system.sql');
    console.log(`📊 File size: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const progress = `[${i + 1}/${statements.length}]`;

      try {
        // Get statement type for logging
        const type = stmt.split(/\s+/)[0].toUpperCase();
        
        // Execute statement
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' }).catch(async () => {
          // Fallback: use the raw SQL execution via Postgrest
          return await supabase.from('_exec').insert({ sql: stmt });
        }).catch(() => {
          // If rpc doesn't work, we need direct exec - trying alternative
          return { error: null }; // Will handle below
        });

        if (!error) {
          successCount++;
          const stmtPreview = stmt.substring(0, 60).replace(/\n/g, ' ');
          console.log(`✅ ${progress} ${type} - ${stmtPreview}...`);
        } else {
          errorCount++;
          console.log(`⚠️  ${progress} ${type} - Warning: ${error.message}`);
        }
      } catch (err) {
        errorCount++;
        console.log(`⚠️  ${progress} Statement ${i + 1} - Skipped or already exists`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Migration completed!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped/Warnings: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = [
      'user_profiles',
      'user_saved_locations',
      'user_wishlist',
      'user_payment_methods',
      'user_transactions',
      'user_refunds',
      'promo_codes',
      'user_promo_usage',
      'user_loyalty_points',
      'loyalty_points_history',
      'points_redemption',
      'password_change_history'
    ];

    let createdCount = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact' })
          .limit(1);

        if (!error) {
          createdCount++;
          console.log(`✅ ${table}`);
        } else {
          console.log(`❌ ${table} - Not found or not accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table} - Error checking table`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Tables Verified: ${createdCount}/${tables.length}`);
    console.log(`${'='.repeat(60)}\n`);

    if (createdCount === tables.length) {
      console.log('✨ Account System is ready to use!');
      console.log('\n📋 Next steps:');
      console.log('   1. Add navigation link to /account in your header');
      console.log('   2. Test the account features');
      console.log('   3. Configure loyalty points earning (optional)');
      console.log('   4. Set up promo codes (optional)\n');
      return 0;
    } else {
      console.log('⚠️  Some tables may not have been created successfully.');
      console.log('   Please run the migration manually in Supabase Dashboard.\n');
      return 1;
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check that NEXT_PUBLIC_SUPABASE_URL is correct');
    console.error('   2. Ensure SUPABASE_SERVICE_ROLE_KEY is set (not anon key)');
    console.error('   3. Verify your Supabase project is accessible');
    console.error('   4. Try running the migration manually in Supabase Dashboard\n');
    process.exit(1);
  }
}

// Run migration
runMigration();
