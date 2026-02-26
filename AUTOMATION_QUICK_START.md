# AUTOMATION QUICK START - CODE EXAMPLES
## Copy-Paste Implementation Guide

---

## 1. QUICK START: Setup in 10 Minutes

### Install Dependencies (1 minute)
```bash
npm install jsonwebtoken qrcode razorpay nodemailer crypto
npm install -D @types/jsonwebtoken @types/qrcode
```

### Add Environment Variables (2 minutes)
```bash
# .env.local
cat > .env.local << 'EOF'
# Booking Automation
NEXT_PUBLIC_AUTO_BOOKING_ENABLED=true
AUTO_BOOKING_TIMEOUT=30000
AUTO_BOOKING_RETRY_COUNT=3

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# QR Code
QR_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
QR_EXPIRATION_HOURS=4

# Fraud Detection
FRAUD_DETECTION_ENABLED=true
FRAUD_ALERT_THRESHOLD=70

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@moviebooker.com

# Database
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
EOF
```

### Test Connection (2 minutes)
```bash
# Test database
npx supabase status

# Test payment gateway (requires Razorpay account)
curl -u YOUR_KEY_ID: https://api.razorpay.com/v1/health

# Test SMTP
node scripts/test-email.js
```

---

## 2. IMPLEMENTATION CODE EXAMPLES

### Example 1: Auto-Booking in Your Component

**Copy this to your booking component:**

```typescript
// components/AutoBookingForm.tsx
'use client';

import { useState } from 'react';
import { autoBookWithFallback } from '@/lib/booking/auto-booking';

interface Theatre {
  id: string;
  name: string;
  apiEndpoint: string;
}

export default function AutoBookingForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Step 1: Get user's theatre preferences from database
  const [theatres, setTheatres] = useState<Theatre[]>([
    { id: '1', name: 'PVR Cinemas', apiEndpoint: 'https://pvr-api.example.com' },
    { id: '2', name: 'IMAX Theatre', apiEndpoint: 'https://imax-api.example.com' },
    { id: '3', name: 'Sathyam Cinemas', apiEndpoint: 'https://sathyam-api.example.com' }
  ]);
  
  const handleAutoBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 2: Prepare booking request
      const bookingRequest = {
        movieId: 'movie-123',
        showtimeId: 'showtime-456',
        seats: ['A1', 'A2', 'A3'],
        customerId: 'customer-789'
      };
      
      // Step 3: Call auto-booking API
      const response = await fetch('/api/booking/auto-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          theatreIds: theatres.map(t => t.id),
          ...bookingRequest
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // ✅ Booking successful
        setResult({
          status: 'success',
          message: `Booked at ${data.data.theatreName}!`,
          bookingId: data.data.bookingId,
          attempts: data.data.attemptCount
        });
        
        // Redirect to payment
        window.location.href = `/checkout/${data.data.bookingId}`;
      } else {
        // ❌ All theatres failed
        setResult({
          status: 'error',
          message: 'All theatres full. Try another showtime.',
          failures: data.data.failureHistory
        });
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Book Your Tickets</h2>
      
      <form onSubmit={handleAutoBook}>
        {/* Movie Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Movie</label>
          <select defaultValue="movie-123" className="w-full p-2 border rounded">
            <option value="movie-123">Avatar 2</option>
            <option value="movie-456">Inception</option>
          </select>
        </div>
        
        {/* Seat Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Seats</label>
          <div className="grid grid-cols-4 gap-2">
            {['A1', 'A2', 'A3', 'A4'].map(seat => (
              <button
                key={seat}
                type="button"
                className="p-2 border rounded hover:bg-blue-200"
              >
                {seat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Booking...' : 'Auto-Book at Preferred Theatres'}
        </button>
      </form>
      
      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 rounded ${result.status === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
          <h3 className="font-bold">{result.message}</h3>
          {result.bookingId && <p className="text-sm">Booking ID: {result.bookingId}</p>}
          {result.attempts && <p className="text-sm">Attempts: {result.attempts}</p>}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Payment Automation

**Copy this for payment processing:**

```typescript
// app/checkout/[bookingId]/page.tsx
'use client';

import { useEffect } from 'react';

export default function CheckoutPage({ params }: { params: { bookingId: string } }) {
  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Step 1: Get booking details
        const bookingRes = await fetch(`/api/bookings/${params.bookingId}`);
        const booking = await bookingRes.json();
        
        // Step 2: Create payment order (automated)
        const orderRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: params.bookingId,
            amount: booking.totalAmount
          })
        });
        
        const { orderId } = await orderRes.json();
        
        // Step 3: Initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: booking.totalAmount * 100, // Convert to paise
          currency: 'INR',
          order_id: orderId,
          
          // Handler after user completes payment
          handler: async (response: any) => {
            // Step 4: Verify payment (automated)
            const verifyRes = await fetch('/api/payments', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: params.bookingId
              })
            });
            
            if (verifyRes.ok) {
              // ✅ Payment verified, booking confirmed
              // QR code automatically generated
              // Email automatically sent
              window.location.href = `/confirmation/${params.bookingId}`;
            } else {
              alert('Payment verification failed');
            }
          },
          
          prefill: {
            name: 'Your Name',
            email: 'your-email@gmail.com',
            contact: '9999999999'
          }
        };
        
        // Open Razorpay checkout
        const Razorpay = (window as any).Razorpay;
        new Razorpay(options).open();
      } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed');
      }
    };
    
    initializePayment();
  }, [params.bookingId]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Payment...</h1>
        <p className="text-gray-600">Please complete the payment in the popup window</p>
      </div>
    </div>
  );
}
```

### Example 3: Confirmation Page (Auto-Showing QR)

**Copy this for booking confirmation:**

```typescript
// app/confirmation/[bookingId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ConfirmationPage({ params }: { params: { bookingId: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBookingAndQR = async () => {
      try {
        // Get booking details
        const bookingRes = await fetch(`/api/bookings/${params.bookingId}`);
        const bookingData = await bookingRes.json();
        setBooking(bookingData);
        
        // Get QR code (automatically generated after payment)
        const qrRes = await fetch(`/api/qr/generate?bookingId=${params.bookingId}`);
        const qrData = await qrRes.json();
        
        if (qrData.success) {
          setQrCode(qrData.data.qrCodeImage);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingAndQR();
  }, [params.bookingId]);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✓ Booking Confirmed!</h1>
        
        {/* Booking Details */}
        <div className="bg-white p-6 rounded-lg mb-6 border">
          <h2 className="text-2xl font-bold mb-4">{booking?.movieTitle}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">DATE & TIME</p>
              <p className="text-lg font-semibold">{booking?.showDateTime}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">THEATRE</p>
              <p className="text-lg font-semibold">{booking?.theatreName}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">SEATS</p>
              <p className="text-lg font-semibold">{booking?.seats?.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">BOOKING ID</p>
              <p className="text-lg font-semibold">{params.bookingId}</p>
            </div>
          </div>
        </div>
        
        {/* QR Code */}
        {qrCode && (
          <div className="bg-white p-6 rounded-lg border text-center mb-6">
            <p className="text-gray-600 text-sm mb-4">YOUR ENTRY TICKET (Valid for 4 hours)</p>
            <img
              src={qrCode}
              alt="Booking QR Code"
              className="w-64 h-64 mx-auto border-2 border-gray-200 p-2"
            />
            <p className="text-sm text-gray-600 mt-4">Show this QR code at theatre entry</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
          >
            🖨 Print Ticket
          </button>
          
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCode || '';
              link.download = `ticket-${params.bookingId}.png`;
              link.click();
            }}
            className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
          >
            💾 Download QR
          </button>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          ✓ Confirmation email sent to your registered email address<br/>
          ✓ QR code is valid for 4 hours from booking time<br/>
          ✓ Please arrive 15 minutes before showtime<br/>
          ✓ Cancellation allowed 12 hours before show
        </p>
      </div>
    </div>
  );
}
```

### Example 4: Fraud Detection Helper

**Copy this utility function:**

```typescript
// lib/services/fraud-detection.ts
export interface FraudAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

export async function analyzeBookingForFraud(
  booking: any,
  userHistory: any
): Promise<FraudAnalysis> {
  let riskScore = 0;
  const reasons: string[] = [];
  
  // Check 1: Geo-velocity (impossible travel)
  if (userHistory.lastBookingLocation && booking.theatre.location) {
    const distance = calculateDistance(
      userHistory.lastBookingLocation,
      booking.theatre.location
    );
    const timeDiff = (new Date().getTime() - userHistory.lastBookingTime) / 1000 / 3600; // hours
    
    if (distance > 500 && timeDiff < 1) {
      riskScore += 30;
      reasons.push(`Geo-velocity: ${distance}km in ${timeDiff.toFixed(1)}h`);
    }
  }
  
  // Check 2: Unusual spending
  if (userHistory.averageSpend && booking.totalAmount > userHistory.averageSpend * 5) {
    riskScore += 20;
    reasons.push('Amount 5x higher than normal spending');
  }
  
  // Check 3: New payment method
  if (booking.newPaymentMethod && !userHistory.hasPaymentHistory) {
    riskScore += 15;
    reasons.push('First payment with new card');
  }
  
  // Check 4: Rate limiting
  if (userHistory.bookingsInLastHour > 10) {
    riskScore += 25;
    reasons.push(`${userHistory.bookingsInLastHour} bookings in last hour`);
  }
  
  // Check 5: Duplicate booking
  if (userHistory.hasDuplicateBooking) {
    riskScore += 35;
    reasons.push('Duplicate of recent booking');
  }
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (riskScore < 30) riskLevel = 'LOW';
  else if (riskScore < 70) riskLevel = 'MEDIUM';
  else riskLevel = 'HIGH';
  
  return { riskScore, riskLevel, reasons };
}

function calculateDistance(loc1: any, loc2: any): number {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Example 5: Email Notification Helper

**Copy this for sending emails:**

```typescript
// lib/services/email-service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendBookingConfirmation(email: string, booking: any, qrCode: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `✓ Booking Confirmed - ${booking.movieTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed!</h2>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${booking.movieTitle}</h3>
          <p><strong>Theatre:</strong> ${booking.theatreName}</p>
          <p><strong>Date & Time:</strong> ${booking.showDateTime}</p>
          <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
          <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>Your Entry Ticket (QR Code):</strong></p>
          <img src="${qrCode}" alt="QR Code" style="width: 300px; height: 300px; border: 2px solid #ccc; padding: 10px;">
          <p style="color: red; font-weight: bold;">Valid for 4 hours</p>
        </div>
        
        <hr style="margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Confirmation Email | Please arrive 15 minutes before showtime | Cancellation allowed 12 hours before
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${email}`);
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

export async function sendPaymentReceipt(email: string, payment: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Payment Receipt - ₹${payment.amount} Received`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Received ✓</h2>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${payment.amount}</p>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
          <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
          <p><strong>Date & Time:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">COMPLETED ✓</span></p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Receipt sent to ${email}`);
  } catch (error) {
    console.error('Receipt send failed:', error);
    throw error;
  }
}

export async function sendShowReminder(email: string, booking: any, hoursUntilShow: number) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Reminder: ${booking.movieTitle} starts in ${hoursUntilShow} hours!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${booking.movieTitle} - Show Reminder</h2>
        <p>Your show starts in ${hoursUntilShow} hours!</p>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px;">
          <p><strong>Theatre:</strong> ${booking.theatreName}</p>
          <p><strong>Time:</strong> ${booking.showDateTime}</p>
          <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
        </div>
        
        <p>Please arrive 15 minutes early.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Reminder send failed:', error);
  }
}
```

---

## 3. DATABASE SETUP SCRIPT

**Copy this to setup database automatically:**

```sql
-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  risk_score NUMERIC(5, 2) NOT NULL,
  risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
  alert_type VARCHAR(100),
  reasons TEXT[], -- Array of fraud reasons
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, approved, blocked
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  email_type VARCHAR(100), -- booking_confirmation, payment_receipt, reminder, etc
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'sent', -- sent, failed, bounced
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

-- Create qr_codes table (if not exists)
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  scan_count INT DEFAULT 0,
  last_scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Create theatre_preferences table
CREATE TABLE IF NOT EXISTS theatre_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theatre_id UUID NOT NULL REFERENCES theatres(id),
  preference_order INT, -- 1 = first choice, 2 = second, etc
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, theatre_id)
);

-- Add indexes for performance
CREATE INDEX idx_fraud_alerts_booking_id ON fraud_alerts(booking_id);
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_qr_codes_booking_id ON qr_codes(booking_id);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX idx_theatre_preferences_user_id ON theatre_preferences(user_id);
```

---

## 4. TEST YOUR AUTOMATION

```bash
# Test 1: Auto-booking endpoint
curl -X POST http://localhost:3000/api/booking/auto-book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "movieId": "movie-123",
    "showtimeId": "showtime-456",
    "seats": ["A1", "A2"],
    "theatreIds": ["theatre-1", "theatre-2", "theatre-3"]
  }'

# Expected response (success):
{
  "success": true,
  "data": {
    "bookingId": "booking-789",
    "theatreName": "PVR Cinemas",
    "attemptCount": 1
  }
}

# Test 2: Payment verification
curl -X PUT http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "paymentId": "pay-456",
    "signature": "sig-789",
    "bookingId": "booking-123"
  }'

# Test 3: QR generation
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"bookingId": "booking-123"}'

# Test 4: Email sending
node scripts/test-email.js
```

---

## 5. MONITORING AUTOMATION

**Create monitoring script:**

```typescript
// scripts/monitor-automation.ts
async function monitorAutomation() {
  console.log('🔍 Monitoring Automation Systems...\n');
  
  // Check auto-booking health
  const bookingHealth = await fetch('/api/health/auto-booking');
  console.log('Auto-Booking:', await bookingHealth.json());
  
  // Check payment processing
  const paymentHealth = await fetch('/api/health/payments');
  console.log('Payment:', await paymentHealth.json());
  
  // Check QR generation
  const qrHealth = await fetch('/api/health/qr');
  console.log('QR System:', await qrHealth.json());
  
  // Check email service
  const emailHealth = await fetch('/api/health/email');
  console.log('Email Service:', await emailHealth.json());
  
  // Check fraud detection
  const fraudHealth = await fetch('/api/health/fraud');
  console.log('Fraud Detection:', await fraudHealth.json());
  
  // Get statistics
  const stats = await fetch('/api/stats/automation');
  console.log('\n📊 Automation Stats:', await stats.json());
}

monitorAutomation().catch(console.error);
```

Run monitoring:
```bash
node scripts/monitor-automation.ts
```

---

This gives you a complete automation system ready to deploy! 🚀
