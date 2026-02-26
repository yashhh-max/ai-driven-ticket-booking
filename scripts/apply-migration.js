#!/usr/bin/env node

/**
 * Migration script to fix the process_pre_booking function in Supabase
 * Run with: node scripts/apply-migration.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  console.error('Please set these environment variables before running this script');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ADMIN_KEY}`,
        'apikey': SUPABASE_ADMIN_KEY,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    // For direct SQL execution, we need to use Supabase JS client
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function runMigration() {
  try {
    console.log('📋 Reading migration file...');
    const migrationFile = path.join(__dirname, 'migrate-fix-prebooking-function.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('🔄 Applying migration to Supabase...');
    console.log('This will update the process_pre_booking function...\n');
    
    // For Supabase, we'll need to use their client library instead
    console.log('⚠️  Note: For production, please apply this using Supabase SQL Editor:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy the contents of scripts/migrate-fix-prebooking-function.sql');
    console.log('4. Click "Run"\n');
    
    console.log('📋 Migration SQL:\n');
    console.log('---');
    console.log(sql);
    console.log('---\n');
    
    console.log('✅ Migration script is ready to apply manually via Supabase dashboard');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runMigration();
