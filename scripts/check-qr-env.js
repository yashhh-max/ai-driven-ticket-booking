/**
 * Diagnostic Script for QR Code System
 * Run this to check if all required environment variables are properly configured
 * 
 * Usage: node scripts/check-qr-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  white: '\x1b[37m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

function checkEnvironmentVariables() {
  console.log(colorize('\n🔍 QR Code System - Environment Variable Diagnostic\n', colors.blue));
  
  // Check for .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envLocalExists = fs.existsSync(envLocalPath);
  
  console.log(`1. ${colorize('.env.local file:', colors.white)}`);
  if (envLocalExists) {
    console.log(`   ${colorize('✅ File exists', colors.green)}`);
    
    // Read and check contents
    try {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      
      // Check for QR_JWT_SECRET
      console.log(`\n2. ${colorize('QR_JWT_SECRET:', colors.white)}`);
      const qrJwtSecretMatch = envContent.match(/QR_JWT_SECRET\s*=\s*(.+)/);
      if (qrJwtSecretMatch) {
        const secret = qrJwtSecretMatch[1].trim();
        if (secret.length >= 32) {
          console.log(`   ${colorize('✅ Found (length: ' + secret.length + ' chars)', colors.green)}`);
        } else {
          console.log(`   ${colorize('⚠️  Found but too short (length: ' + secret.length + ' chars, minimum: 32)', colors.yellow)}`);
        }
      } else {
        console.log(`   ${colorize('❌ Not found in .env.local', colors.red)}`);
        console.log(`   ${colorize('   Add: QR_JWT_SECRET=<your-32-char-secret>', colors.yellow)}`);
      }
      
      // Check for SUPABASE_SERVICE_ROLE_KEY
      console.log(`\n3. ${colorize('SUPABASE_SERVICE_ROLE_KEY:', colors.white)}`);
      const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/);
      if (serviceKeyMatch) {
        const key = serviceKeyMatch[1].trim();
        if (key.length > 50) { // Typical JWT length
          console.log(`   ${colorize('✅ Found (length: ' + key.length + ' chars)', colors.green)}`);
        } else {
          console.log(`   ${colorize('⚠️  Found but unusually short (length: ' + key.length + ' chars)', colors.yellow)}`);
        }
      } else {
        console.log(`   ${colorize('❌ Not found in .env.local', colors.red)}`);
        console.log(`   ${colorize('   Add: SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>', colors.yellow)}`);
      }
      
      // Check for Supabase public keys
      console.log(`\n4. ${colorize('NEXT_PUBLIC_SUPABASE_URL:', colors.white)}`);
      const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
      if (supabaseUrlMatch) {
        console.log(`   ${colorize('✅ Found', colors.green)}`);
      } else {
        console.log(`   ${colorize('❌ Not found in .env.local', colors.red)}`);
      }
      
      console.log(`\n5. ${colorize('NEXT_PUBLIC_SUPABASE_ANON_KEY:', colors.white)}`);
      const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/);
      if (anonKeyMatch) {
        console.log(`   ${colorize('✅ Found', colors.green)}`);
      } else {
        console.log(`   ${colorize('❌ Not found in .env.local', colors.red)}`);
      }
    } catch (error) {
      console.log(`   ${colorize('❌ Could not read file: ' + error.message, colors.red)}`);
    }
  } else {
    console.log(`   ${colorize('❌ File not found', colors.red)}`);
    console.log(`   ${colorize('   Create .env.local in project root with:', colors.yellow)}`);
    console.log(`   QR_JWT_SECRET=<your-32-char-secret>`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>`);
  }
  
  // Runtime environment check
  console.log(`\n${colorize('\n📊 Runtime Environment Variables:', colors.blue)}`);
  
  console.log(`\n6. ${colorize('QR_JWT_SECRET (runtime):', colors.white)}`);
  if (process.env.QR_JWT_SECRET) {
    console.log(`   ${colorize('✅ Available (length: ' + process.env.QR_JWT_SECRET.length + ' chars)', colors.green)}`);
  } else {
    console.log(`   ${colorize('❌ Not available at runtime', colors.red)}`);
    console.log(`   ${colorize('   Make sure .env.local is in the project root', colors.yellow)}`);
    console.log(`   ${colorize('   Restart your dev server after adding env vars', colors.yellow)}`);
  }
  
  console.log(`\n7. ${colorize('SUPABASE_SERVICE_ROLE_KEY (runtime):', colors.white)}`);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`   ${colorize('✅ Available (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ' chars)', colors.green)}`);
  } else {
    console.log(`   ${colorize('❌ Not available at runtime', colors.red)}`);
    console.log(`   ${colorize('   Make sure .env.local is in the project root', colors.yellow)}`);
    console.log(`   ${colorize('   Restart your dev server after adding env vars', colors.yellow)}`);
  }
  
  // Summary
  console.log(`\n${colorize('\n📋 Summary:', colors.blue)}`);
  
  const hasQrSecret = !!process.env.QR_JWT_SECRET && process.env.QR_JWT_SECRET.length >= 32;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (hasQrSecret && hasServiceKey && hasSupabaseUrl && hasAnonKey) {
    console.log(colorize('✅ All environment variables are properly configured!', colors.green));
    console.log('\nYour QR code system should be working correctly.');
    console.log('If QR codes still are not generating, check:');
    console.log('  1. Browser console (F12) for JavaScript errors');
    console.log('  2. Your dev server terminal for error logs');
    console.log('  3. That your booking status is "confirmed"');
  } else {
    console.log(colorize('❌ Some environment variables are missing or invalid:', colors.red));
    console.log('\nTo fix, follow these steps:');
    console.log('1. Open or create .env.local in your project root');
    console.log('2. Add the required environment variables (see above)');
    console.log('3. Save the file');
    console.log('4. Restart your dev server');
    console.log('\nFor detailed setup instructions, see: QR_ENV_SETUP.md');
  }
  
  console.log(colorize('\n', colors.blue));
}

// Run the check
checkEnvironmentVariables();
