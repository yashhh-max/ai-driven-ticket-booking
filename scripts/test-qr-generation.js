/**
 * Test QR Code Generation
 * This script tests the QR code generation without needing a booking
 */

// Load .env.local
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent
    .split(/[\r\n]+/)
    .filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('```'))
    .forEach(line => {
      const trimmed = line.trim();
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        process.env[key] = value;
      }
    });
}

async function testQRGeneration() {
  console.log('🧪 Testing QR Code Generation...\n');
  
  // Check environment
  console.log('📋 Environment Check:');
  console.log('  QR_JWT_SECRET:', process.env.QR_JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('');

  // Test JWT Generation
  console.log('🔐 Testing JWT Token Generation:');
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.QR_JWT_SECRET;
    
    if (!secret) {
      console.error('  ❌ QR_JWT_SECRET is missing!');
      return;
    }

    const payload = {
      bookingId: 'test-booking-123',
      userId: 'test-user-123',
      theatreId: 'theatre-123',
      showDate: '2026-02-28',
      showTime: '18:00',
      seats: ['A1', 'A2']
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: '4h',
      algorithm: 'HS256',
    });

    console.log('  ✅ JWT token generated successfully');
    console.log('  Token preview:', token.substring(0, 50) + '...');
  } catch (error) {
    console.error('  ❌ JWT generation failed:', error.message);
    return;
  }

  // Test QR Code Image Generation
  console.log('\n📊 Testing QR Image Generation:');
  try {
    const QRCode = require('qrcode');
    const testData = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJib29raW5nSWQiOiJ0ZXN0In0.test';
    
    const qrDataUrl = await QRCode.toDataURL(testData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log('  ✅ QR code image generated successfully');
    console.log('  Image size:', Math.round(qrDataUrl.length / 1024) + ' KB');
  } catch (error) {
    console.error('  ❌ QR image generation failed:', error.message);
    return;
  }

  // Test Supabase Connection
  console.log('\n🗄️  Testing Supabase Connection:');
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to fetch tables to verify connection
    const { data: tables, error } = await supabase
      .from('booking_qr_codes')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('  ❌ Table "booking_qr_codes" does not exist');
        console.log('  📝 Run: node scripts/002_create_qr_code_schema.sql via Supabase SQL editor');
      } else {
        console.error('  ❌ Connection error:', error.message);
      }
    } else {
      console.log('  ✅ Supabase connection successful');
      console.log('  ✅ Table "booking_qr_codes" exists');
    }
  } catch (error) {
    console.error('  ❌ Supabase test failed:', error.message);
  }

  console.log('\n✅ QR Code Generation Test Complete');
}

testQRGeneration().catch(console.error);
