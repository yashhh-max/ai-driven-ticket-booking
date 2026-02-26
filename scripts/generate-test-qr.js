#!/usr/bin/env node

/**
 * Test QR Code Generator
 * Generates a random QR code with test booking data
 * Usage: node scripts/generate-test-qr.js
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const QR_JWT_SECRET = process.env.QR_JWT_SECRET || 'b8f3c2a7d9e1f4b6c8a3d7e2f9b4c6a1e8d3c7b2a9f4e1d6c3b8a5f2e9d4c1';

async function generateTestQR() {
  try {
    console.log('🎲 Generating Random Test QR Code...\n');

    // Generate random IDs
    const bookingId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const userId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const theatreId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);

    // Create test payload
    const testPayload = {
      bookingId: bookingId,
      userId: userId,
      theatreId: theatreId,
      showDate: '2026-02-21',
      showTime: '14:30',
      seats: ['A1', 'A2', 'B1'],
    };

    console.log('📋 Test Booking Data:');
    console.log(JSON.stringify(testPayload, null, 2));

    // Sign JWT token
    const token = jwt.sign(testPayload, QR_JWT_SECRET, {
      expiresIn: '4h',
      algorithm: 'HS256',
    });

    console.log('\n🔐 JWT Token (first 50 chars):');
    console.log(token.substring(0, 50) + '...');

    // Generate QR code image
    const qrDataUrl = await QRCode.toDataURL(token, {
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

    // Save QR code as PNG
    const outputDir = path.join(__dirname, 'qr-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `qr-test-${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);

    // Extract base64 and save as PNG
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    console.log(`\n✅ QR Code Generated Successfully!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`\n📊 QR Code Details:`);
    console.log(`   - Booking ID: ${bookingId}`);
    console.log(`   - Show Date: 2026-02-21`);
    console.log(`   - Show Time: 14:30`);
    console.log(`   - Seats: A1, A2, B1`);
    console.log(`   - Expires: 4 hours from now`);

    console.log(`\n🎯 Quick Copy: Open this file to view the QR code`);
    console.log(`   ${filepath}`);

    // Also copy to clipboard-friendly HTML
    const htmlFile = path.join(outputDir, `qr-test-${Date.now()}.html`);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test QR Code</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; text-align: center; }
        img { border: 2px solid #ccc; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; text-align: left; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test QR Code</h1>
        <img src="${qrDataUrl}" alt="Test QR Code" width="300" height="300">
        <h3>Booking Details</h3>
        <pre>${JSON.stringify(testPayload, null, 2)}</pre>
        <p><strong>Token:</strong><br><code style="word-break: break-all;">${token}</code></p>
    </div>
</body>
</html>
    `;
    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`\n🌐 HTML Preview: ${htmlFile}`);

  } catch (error) {
    console.error('❌ Error generating QR code:', error.message);
    process.exit(1);
  }
}

generateTestQR();
