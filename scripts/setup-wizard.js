#!/usr/bin/env node

/**
 * Interactive Account System Setup Wizard
 * Guides you through the setup process
 * 
 * Usage: node scripts/setup-wizard.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function runWizard() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎬 AuroSeat Account System Setup Wizard                  ║
║                                                            ║
║   This wizard will guide you through setting up the       ║
║   complete account management system with 8 features:     ║
║                                                            ║
║   ✓ Profile Management                                    ║
║   ✓ Saved Locations                                       ║
║   ✓ Wishlist                                              ║
║   ✓ Payment Methods                                       ║
║   ✓ Transaction History                                   ║
║   ✓ Offers & Promo Codes                                  ║
║   ✓ Loyalty Points                                        ║
║   ✓ Account Settings                                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Explain database setup
    console.log('\n📋 STEP 1: Database Setup\n');
    console.log('The account system requires creating 12 tables in Supabase.\n');
    
    const hasServiceKey = await question('Do you have your SUPABASE_SERVICE_ROLE_KEY? (y/n): ');
    
    if (hasServiceKey.toLowerCase() === 'y') {
      await runAutomatedSetup();
    } else {
      await runManualSetup();
    }

  } catch (error) {
    console.error('\n❌ Setup wizard error:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function runAutomatedSetup() {
  console.log('\n🔄 Attempting automated database setup...\n');
  
  // Check for service key in env
  require('dotenv').config();
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceKey || !url) {
    console.log('❌ Service role key or URL not found in .env.local');
    console.log('\nPlease add to .env.local:');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n');
    await runManualSetup();
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, serviceKey);

    const sqlFile = path.join(__dirname, '020_create_account_system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split and execute statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    let success = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (!error) {
          success++;
          const type = stmt.split(/\s+/)[0];
          console.log(`  ✅ [${i + 1}/${statements.length}] ${type.toUpperCase()}`);
        }
      } catch (e) {
        // Statement might already exist, continue
      }
    }

    console.log(`\n✅ Database setup completed! (${success}/${statements.length} statements executed)\n`);
    await continueToNavigation();

  } catch (error) {
    console.log('⚠️  Automated setup failed. Falling back to manual setup...\n');
    await runManualSetup();
  }
}

async function runManualSetup() {
  console.log('\n📝 STEP 1: Manual Database Setup\n');
  console.log('Follow these steps to set up the database:\n');
  console.log('1. Go to https://app.supabase.com/project/[your-project]/sql/new');
  console.log('2. Copy the SQL migration file:\n');

  const sqlFile = path.join(__dirname, '020_create_account_system.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('   ' + '─'.repeat(58));
  const lines = sql.split('\n').slice(0, 10);
  lines.forEach(line => {
    console.log('   ' + line);
  });
  console.log('   [... ' + (sql.split('\n').length - 10) + ' more lines ...]');
  console.log('   ' + '─'.repeat(58));

  console.log('\n3. Paste the SQL into Supabase SQL editor');
  console.log('4. Click "Run" to execute\n');

  const done = await question('Have you completed the database setup in Supabase? (y/n): ');
  
  if (done.toLowerCase() === 'y') {
    console.log('\n✅ Great! Moving on...\n');
    await continueToNavigation();
  } else {
    console.log('\n⏸️  Please complete the database setup and run this wizard again.\n');
    rl.close();
    process.exit(0);
  }
}

async function continueToNavigation() {
  console.log('\n📌 STEP 2: Add Navigation Link\n');
  console.log('Add the account link to your header navigation:\n');
  console.log('File: components/header-client.tsx\n');
  console.log(`Add this to the user menu dropdown:`);
  console.log(`
  <DropdownMenuItem asChild>
    <Link href="/account" className="flex items-center gap-2">
      <User className="h-4 w-4" />
      My Account
    </Link>
  </DropdownMenuItem>
  `);

  const added = await question('\nHave you added the navigation link? (y/n): ');
  
  if (added.toLowerCase() === 'y') {
    await continueToTesting();
  } else {
    console.log('\n⏸️  Please add the navigation link and run this wizard again.\n');
    rl.close();
    process.exit(0);
  }
}

async function continueToTesting() {
  console.log('\n🧪 STEP 3: Test the System\n');
  console.log('Your account system is ready! Here\'s what to test:\n');

  const features = [
    { name: 'Profile', path: '/account', test: 'Update your profile information' },
    { name: 'Locations', path: '/account', test: 'Add a saved location' },
    { name: 'Wishlist', path: '/account', test: 'Add a movie to wishlist' },
    { name: 'Payment Methods', path: '/account', test: 'Add a payment method' },
    { name: 'Transaction History', path: '/account', test: 'View transactions' },
    { name: 'Promo Codes', path: '/account', test: 'Browse available offers' },
    { name: 'Loyalty Points', path: '/account', test: 'Check points balance' },
    { name: 'Settings', path: '/account', test: 'Change password' }
  ];

  console.log('Testing Checklist:\n');
  features.forEach((f, i) => {
    console.log(`  [ ] ${i + 1}. ${f.name} - ${f.test}`);
  });

  console.log('\n\n🔗 Access the account system at: http://localhost:3000/account\n');

  const ready = await question('Start your dev server and test the features? (y/n): ');
  
  if (ready.toLowerCase() === 'y') {
    await showCompletion();
  } else {
    console.log('\n✨ Setup complete! You can test features whenever ready.\n');
    rl.close();
    process.exit(0);
  }
}

async function showCompletion() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              ✨ Setup Complete! ✨                         ║
║                                                            ║
║   Your Account System is ready with 8 features:           ║
║                                                            ║
║   ✅ Profile Management                                   ║
║   ✅ Saved Locations                                      ║
║   ✅ Wishlist                                             ║
║   ✅ Payment Methods                                      ║
║   ✅ Transaction History & Refunds                        ║
║   ✅ Offers & Promo Codes                                 ║
║   ✅ Loyalty Points & Rewards                             ║
║   ✅ Account Settings                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📚 Documentation:
  • Quick Start: ACCOUNT_SYSTEM_QUICK_START.md
  • Full Docs: ACCOUNT_SYSTEM_DOCUMENTATION.md
  • Implementation: ACCOUNT_SYSTEM_IMPLEMENTATION.md

🚀 Next Steps:
  1. Start dev server: npm run dev
  2. Navigate to http://localhost:3000/account
  3. Test all features
  4. Customize as needed

📊 Architecture:
  • Database: 12 tables with RLS policies
  • API: 24 endpoints
  • UI: 8 feature sections
  • Client: Centralized API service

💡 Pro Tips:
  • Auto-create user profiles on signup
  • Earn loyalty points on bookings
  • Allow promo codes during checkout
  • Set up email notifications

Need help? Check the documentation files for:
  • API documentation
  • TypeScript types
  • Database schema
  • Integration examples

Happy coding! 🎉
  `);

  rl.close();
  process.exit(0);
}

// Run the wizard
runWizard().catch(err => {
  console.error('❌ Wizard error:', err);
  rl.close();
  process.exit(1);
});
