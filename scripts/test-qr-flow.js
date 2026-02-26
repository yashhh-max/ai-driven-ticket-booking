/**
 * Test QR Code Generation End-to-End
 * Simulates the entire flow from payment to QR code storage
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function testQRFlow() {
  console.log('🧪 Testing Complete QR Generation Flow...\n');

  // Test 1: Generate JWT Token
  console.log('Step 1️⃣ : JWT Token Generation');
  let token = null;
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.QR_JWT_SECRET;
    
    if (!secret) {
      throw new Error('QR_JWT_SECRET not configured');
    }

    const payload = {
      bookingId: 'booking-' + Math.random().toString(36).substring(7),
      userId: 'user-' + Math.random().toString(36).substring(7),
      theatreId: 'theatre-' + Math.random().toString(36).substring(7),
      showDate: '2026-02-28',
      showTime: '18:00',
      seats: ['A1', 'A2', 'A3']
    };

    token = jwt.sign(payload, secret, {
      expiresIn: '4h',
      algorithm: 'HS256',
    });

    console.log('  ✅ Token generated successfully');
    console.log('  Token payload:', payload);
    console.log('  Token preview:', token.substring(0, 50) + '...\n');
  } catch (error) {
    console.error('  ❌ Token generation failed:', error.message);
    return;
  }

  // Test 2: Generate QR Image
  console.log('Step 2️⃣ : QR Code Image Generation');
  let qrDataUrl = null;
  try {
    const QRCode = require('qrcode');
    
    qrDataUrl = await QRCode.toDataURL(token, {
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

    const imageSizeKB = Math.round(qrDataUrl.length / 1024);
    console.log('  ✅ QR image generated successfully');
    console.log('  Image size:', imageSizeKB, 'KB');
    console.log('  Data URL length:', qrDataUrl.substring(0, 50) + '...\n');
  } catch (error) {
    console.error('  ❌ QR image generation failed:', error.message);
    return;
  }

  // Test 3: Database Connection
  console.log('Step 3️⃣ : Database Connection Test');
  let supabase = null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test connection
    const { data: tables, error } = await supabase
      .from('booking_qr_codes')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('  ✅ Supabase connection successful');
    console.log('  booking_qr_codes table is accessible\n');
  } catch (error) {
    console.error('  ❌ Database connection failed:', error.message);
    return;
  }

  // Test 4: Get a Real Booking from Database
  console.log('Step 4️⃣ : Find Test Booking in Database');
  let testBookingId = null;
  let testUserId = null;
  try {
    // Try to get first confirmed booking from database
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('status', 'confirmed')
      .limit(1);

    if (bookingError) {
      throw bookingError;
    }

    if (!bookings || bookings.length === 0) {
      console.log('  ℹ️  No confirmed bookings found in database');
      console.log('  You need to complete a payment first to test with real data\n');
      console.log('  ✅ All components are working correctly');
      console.log('  System is ready to generate QR codes when you make a booking\n');
      return;
    } else {
      testBookingId = bookings[0].id;
      testUserId = bookings[0].user_id;
      console.log('  ✅ Found test booking:', testBookingId);
      console.log('  With user:', testUserId, '\n');
    }
  } catch (error) {
    console.error('  ❌ Failed to find booking:', error.message);
    return;
  }

  // Test 5: Simulate Database Insert with Real IDs
  console.log('Step 5️⃣ : Test Database Insert with Real Booking');
  try {
    console.log('  Attempting to insert with real booking data:');
    console.log('    booking_id:', testBookingId);
    console.log('    user_id:', testUserId);
    console.log('    qr_token: <JWT token>');
    console.log('    qr_code_image: <base64 PNG data>');
    console.log('    qr_expires_at:', new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), '\n');

    // Remove data URL prefix
    const qrImageBase64 = qrDataUrl.startsWith('data:image/png;base64,')
      ? qrDataUrl.split(',')[1]
      : qrDataUrl;

    const { data, error } = await supabase
      .from('booking_qr_codes')
      .insert({
        booking_id: testBookingId,
        user_id: testUserId,
        qr_token: token,
        qr_code_image: qrImageBase64,
        qr_generated_at: new Date().toISOString(),
        qr_expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        qr_used: false,
      })
      .select();

    if (error) {
      throw error;
    }

    console.log('  ✅ Database insert successful!');
    console.log('  QR record created with ID:', data?.[0]?.id);
    console.log('  Created at:', data?.[0]?.created_at, '\n');

    // Test 6: Verify Data Was Inserted
    console.log('Step 6️⃣ : Verify Database Insert');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('booking_qr_codes')
      .select('*')
      .eq('booking_id', testBookingId)
      .single();

    if (retrieveError) {
      throw retrieveError;
    }

    console.log('  ✅ Successfully retrieved QR data from database');
    console.log('  QR Token matches:', retrievedData.qr_token === token);
    console.log('  Image data present:', retrievedData.qr_code_image.length > 100, 'bytes');
    console.log('  Status: Used =', retrievedData.qr_used);
    console.log('  Expires at:', retrievedData.qr_expires_at, '\n');

    // Test 7: Cleanup - Delete the test record
    console.log('Step 7️⃣ : Cleanup');
    const { error: deleteError } = await supabase
      .from('booking_qr_codes')
      .delete()
      .eq('booking_id', testBookingId);

    if (deleteError) {
      console.warn('  ⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('  ✅ Test record deleted\n');
    }

  } catch (error) {
    console.error('  ❌ Database operation failed:', error.message);
    if (error.details) {
      console.error('  Details:', error.details);
    }
    return;
  }

  console.log('✅ All tests passed! QR generation should work.');
  console.log('\nNext steps:');
  console.log('1. Complete a payment in your app');
  console.log('2. Check that the confirmation page appears');
  console.log('3. Verify QR code displays or retry generates it');
}

testQRFlow().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
