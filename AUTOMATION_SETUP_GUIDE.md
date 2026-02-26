# TICKET BOOKING AUTOMATION - COMPLETE SETUP GUIDE
## Step-by-Step Configuration & Implementation

---

## OVERVIEW: What Automation Features You Have

Your project comes with **5 built-in automation systems**:

```
┌──────────────────────────────────────────────────────┐
│         AUTOMATION FEATURES IN YOUR SYSTEM           │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1. AUTO-BOOKING FALLBACK SYSTEM                      │
│    └─ Automatically books at multiple theatres      │
│                                                       │
│ 2. PAYMENT AUTOMATION                                │
│    └─ Automatically processes payments & verifies   │
│                                                       │
│ 3. QR CODE GENERATION                                │
│    └─ Automatically generates tickets after booking │
│                                                       │
│ 4. FRAUD DETECTION                                   │
│    └─ Automatically checks for suspicious patterns  │
│                                                       │
│ 5. EMAIL NOTIFICATIONS                               │
│    └─ Automatically sends booking confirmations     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## FEATURE 1: AUTO-BOOKING FALLBACK SYSTEM

### What It Does:
User selects 3 preferred theatres, system tries them in order until booking succeeds.

### How It Works:
```
┌──────────────────────────────────────────────┐
│          AUTO-BOOKING FLOW                   │
├──────────────────────────────────────────────┤
│                                              │
│ User Selection:                              │
│ ├─ Movie: Avatar 2                          │
│ ├─ Show Time: 7:00 PM                       │
│ ├─ Seats: 3 seats                           │
│ └─ Theatre Priority:                        │
│    1. PVR Cinemas (1st choice)              │
│    2. IMAX Theatre (2nd choice)             │
│    3. Sathyam Cinemas (3rd choice)          │
│                                              │
│                    ↓                         │
│                                              │
│ System Attempts:                             │
│ ├─ Try PVR Cinemas                          │
│ │  └─ ✓ SUCCESS! Booking confirmed         │
│ │     (No need to try Theatre 2 & 3)        │
│ │                                            │
│ └─ Return: PVR Cinemas booking complete     │
│                                              │
│ (If PVR failed, would try IMAX, then        │
│  Sathyam...)                                 │
│                                              │
└──────────────────────────────────────────────┘
```

### Files Involved:
- `lib/booking/auto-booking.ts` - Core booking logic
- `app/api/booking/auto-book/route.ts` - API endpoint
- `components/auto-booking-flow.tsx` - React components

### Setup Step 1: Enable Auto-Booking Feature

**Step 1a: Add to Environment Variables (.env.local)**
```
# Auto-booking configuration
NEXT_PUBLIC_AUTO_BOOKING_ENABLED=true
AUTO_BOOKING_TIMEOUT=30000  # 30 seconds per theatre
AUTO_BOOKING_RETRY_COUNT=3  # Retry 3 times max
```

**Step 1b: Configure Theatre APIs**

Edit your database to add theatre configurations:

```sql
-- Add API endpoints for theatres in your theatres table
UPDATE theatres SET
  api_endpoint = 'https://pvr-api.example.com/book',
  api_key = 'your-pvr-api-key',
  is_auto_booking_enabled = true
WHERE name = 'PVR Cinemas';

UPDATE theatres SET
  api_endpoint = 'https://imax-api.example.com/book',
  api_key = 'your-imax-api-key',
  is_auto_booking_enabled = true
WHERE name = 'IMAX Theatre';
```

### Setup Step 2: Implement Theatre API Calls

Create API integration for each theatre. Example:

```typescript
// lib/services/theatre-apis.ts
export async function bookAtTheatre(
  theatreId: string,
  bookingDetails: BookingRequest
): Promise<BookingResponse> {
  const theatre = await getTheatreConfig(theatreId);
  
  try {
    const response = await fetch(theatre.api_endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${theatre.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingDetails),
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Theatre API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Booking failed at ${theatre.name}: ${error.message}`);
  }
}
```

### Setup Step 3: Create API Endpoint

The endpoint already exists at `app/api/booking/auto-book/route.ts`. 

**Test it:**
```bash
curl -X POST http://localhost:3000/api/booking/auto-book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "movieId": "movie-123",
    "showtimeId": "showtime-456",
    "seats": ["A1", "A2", "A3"],
    "theatreIds": [
      "theatre-1",  # 1st preference
      "theatre-2",  # 2nd preference
      "theatre-3"   # 3rd preference
    ]
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Booking confirmed!",
  "data": {
    "bookingId": "booking-123",
    "theatreName": "PVR Cinemas",
    "bookingDetails": {
      "movieTitle": "Avatar 2",
      "showTime": "7:00 PM",
      "seats": ["A1", "A2", "A3"]
    },
    "attemptCount": 1
  }
}
```

### Setup Step 4: Add UI Component

Use the provided React component:

```typescript
// In your booking page
import { CompleteAutoBookingPage } from '@/components/auto-booking-flow';

export default function BookingPage() {
  return (
    <div>
      <h1>Book Your Movie Ticket</h1>
      <CompleteAutoBookingPage />
    </div>
  );
}
```

### Auto-Booking Reference Code

**Main Function:**
```typescript
// lib/booking/auto-booking.ts
export async function autoBookWithFallback(
  theatres: Theatre[],
  bookingRequest: BookingRequest
): Promise<AutoBookingResult> {
  const failureHistory = [];
  
  // Try each theatre in order
  for (const theatre of theatres) {
    try {
      const result = await attemptBookingAtTheatre(
        theatre,
        bookingRequest,
        30000 // 30 second timeout
      );
      
      if (result.success) {
        // ✅ Booking succeeded!
        return {
          success: true,
          bookingId: result.bookingId,
          theatre: theatre,
          attemptCount: failureHistory.length + 1
        };
      }
    } catch (error) {
      // ❌ This theatre failed, try next
      failureHistory.push({
        theatre: theatre.name,
        reason: error.message
      });
      
      // Continue to next theatre
      continue;
    }
  }
  
  // All theatres failed
  return {
    success: false,
    failureHistory: failureHistory,
    message: 'All theatres failed. Try again later.'
  };
}
```

---

## FEATURE 2: PAYMENT AUTOMATION

### What It Does:
Automatically processes Razorpay payments, verifies signatures, and confirms bookings.

### How It Works:
```
┌────────────────────────────────────────┐
│      PAYMENT AUTOMATION FLOW           │
├────────────────────────────────────────┤
│                                        │
│ 1. User clicks "Pay Now"               │
│    └─ POST /api/payments               │
│                                        │
│ 2. Backend creates Razorpay order      │
│    └─ Returns orderId to frontend      │
│                                        │
│ 3. User completes payment              │
│    └─ Razorpay returns paymentId       │
│                                        │
│ 4. Verify signature (HMAC-SHA256)      │
│    ├─ Check signature validity         │
│    ├─ If valid → Continue              │
│    └─ If invalid → REJECT (fraud)      │
│                                        │
│ 5. Update booking status               │
│    └─ booking_status = 'confirmed'     │
│                                        │
│ 6. Generate QR code (automatic)        │
│    └─ QR saved to database             │
│                                        │
│ 7. Send email notification             │
│    └─ Include QR code ticket           │
│                                        │
│ 8. Run fraud detection                 │
│    └─ Alert admin if suspicious        │
│                                        │
└────────────────────────────────────────┘
```

### Setup:

**Step 1: Add Razorpay Credentials**
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

**Step 2: Endpoint**
```
POST /api/payments
```

**Step 3: Call from Frontend**
```typescript
// In your payment component
const initializePayment = async () => {
  // Step 1: Create order
  const orderResponse = await fetch('/api/payments', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: 'booking-123',
      amount: 750 // in INR
    })
  });
  
  const { orderId } = await orderResponse.json();
  
  // Step 2: Open Razorpay checkout
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: 75000, // in paise
    currency: 'INR',
    order_id: orderId,
    handler: async (response) => {
      // Step 3: Verify payment
      const verifyResponse = await fetch('/api/payments', {
        method: 'PUT',
        body: JSON.stringify({
          orderId,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        })
      });
      
      if (verifyResponse.ok) {
        alert('✓ Payment successful!');
        // Redirect to confirmation page
      } else {
        alert('✗ Payment verification failed!');
      }
    }
  };
  
  new window.Razorpay(options).open();
};
```

---

## FEATURE 3: QR CODE AUTOMATION

### What It Does:
Automatically generates QR code tickets after payment confirmation.

### How It Works:
```
Following payment verification:
   ↓
Auto-generate JWT token with booking details
   ↓
Auto-convert token to QR code image
   ↓
Auto-save QR to database
   ↓
Auto-send QR via email
```

### Setup:

**Step 1: Create JWT Secret**
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to .env:**
```
QR_JWT_SECRET=your_random_secret_here
```

**Step 2: Test QR Generation**
```bash
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookingId": "booking-123"}'
```

---

## FEATURE 4: FRAUD DETECTION AUTOMATION

### What It Does:
Automatically analyzes bookings for suspicious patterns.

### How It Works:
```
When booking is created:
   ↓
Check 5 fraud patterns:
├─ Geo-velocity (possible in 2 cities at once?)
├─ Unusual amount (5x normal spending?)
├─ New payment method (first time card?)
├─ Rate limiting (20+ bookings/hour?)
└─ Duplicate booking (same seats duplicate time?)
   ↓
Assign risk score (0-100):
├─ <30: AUTO-APPROVE ✓
├─ 30-70: FLAG FOR REVIEW ⚠
└─ >70: AUTO-BLOCK ✗
```

### Setup:

**Step 1: Enable Fraud Detection**
```env
FRAUD_DETECTION_ENABLED=true
FRAUD_ALERT_THRESHOLD=70
```

**Step 2: Automatically Triggered**
- After payment confirmation
- After QR verification
- No additional setup needed!

---

## FEATURE 5: EMAIL NOTIFICATION AUTOMATION

### What It Does:
Automatically sends booking confirmations and updates via email.

### Emails Sent Automatically:

| Trigger | Email | Sent To |
|---------|-------|---------|
| Booking confirmed | Booking Confirmation | Customer |
| Payment completed | Payment Receipt | Customer |
| 2 hours before show | Show Reminder | Customer |
| Booking cancelled | Cancellation Notice | Customer |
| QR scanned at entry | Entry Confirmation | Customer |

### Setup:

**Step 1: SMTP Configuration**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@moviebooker.com
```

**Step 2: Email Templates (Auto-Configured)**
- Booking confirmation with QR
- Payment receipt
- Show reminders
- Cancellation notices

---

## AUTOMATION TRIGGERS & WORKFLOWS

### Complete Workflow: What Happens Automatically

```
┌─────────────────────────────────────────────────────────┐
│    COMPLETE AUTOMATED BOOKING WORKFLOW                  │
└─────────────────────────────────────────────────────────┘

STEP 1: USER SELECTS MOVIE
├─ Choose movie, showtime, seats
└─ Select 3 preferred theatres (priority order)

         ↓

STEP 2: AUTO-BOOKING STARTS (Automatic)
├─ Try theatre #1
├─ If success → Jump to STEP 3
├─ If fail → Try theatre #2
├─ If fail → Try theatre #3
├─ If all fail → Show error to user
└─ Record booking in database

         ↓

STEP 3: FRAUD CHECK (Automatic)
├─ Analyze booking patterns
├─ Run 5 fraud detection checks
├─ If risk < 70 → Proceed
└─ If risk > 70 → Flag for admin review

         ↓

STEP 4: PAYMENT PROCESSING (Automatic)
├─ Create Razorpay order
├─ User pays in popup
├─ Backend verifies HMAC signature
├─ Update booking status to "confirmed"
└─ Record payment in database

         ↓

STEP 5: QR CODE GENERATION (Automatic)
├─ Create JWT with booking details
├─ Generate PNG QR image
├─ Encrypt and save to database
└─ Attach to email

         ↓

STEP 6: SEND EMAIL (Automatic)
├─ Generate email with QR code
├─ Include booking details
├─ Send via SMTP
└─ Store email log in database

         ↓

STEP 7: SCHEDULE REMINDER (Automatic)
├─ Calculate show time
├─ Schedule email for 2 hours before
└─ Queue in email scheduler

         ↓

STEP 8: ENTRY AT THEATRE (Manual scan)
├─ Staff scans QR code
├─ Backend validates JWT signature
├─ Backend checks for duplicates
├─ Auto-mark ticket as used
└─ Send confirmation email to user

         ↓

COMPLETE! ✓
User watched movie, all automated.
```

---

## CONFIGURATION CHECKLIST

### Step 1: Environment Variables
```bash
# Copy and add to .env.local
NEXT_PUBLIC_AUTO_BOOKING_ENABLED=true
AUTO_BOOKING_TIMEOUT=30000
AUTO_BOOKING_RETRY_COUNT=3

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

QR_JWT_SECRET=your_random_secret
QR_EXPIRATION_HOURS=4

FRAUD_DETECTION_ENABLED=true
FRAUD_ALERT_THRESHOLD=70

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

DATABASE_URL=your_supabase_url
```

### Step 2: Database Configuration

Run these SQL commands in Supabase:

```sql
-- 1. Add auto-booking columns to theatres table
ALTER TABLE theatres ADD COLUMN (
  api_endpoint VARCHAR(500),
  api_key VARCHAR(500),
  is_auto_booking_enabled BOOLEAN DEFAULT true
);

-- 2. Create fraud_alerts table
CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  risk_score NUMERIC(5,2),
  alert_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Create email_logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL,
  email_type VARCHAR(100),
  recipient VARCHAR(255),
  sent_at TIMESTAMP DEFAULT now(),
  status VARCHAR(50) DEFAULT 'sent'
);

-- 4. Create qr_codes table (if not exists)
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  token TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### Step 3: Test Automation

```bash
# Test 1: Auto-booking
curl -X POST http://localhost:3000/api/booking/auto-book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "movieId": "movie-1",
    "showtimeId": "show-1",
    "seats": ["A1", "A2"],
    "theatreIds": ["theatre-1", "theatre-2", "theatre-3"]
  }'

# Test 2: Payment verification
curl -X PUT http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "paymentId": "pay-456",
    "signature": "sig-789"
  }'

# Test 3: QR generation
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"bookingId": "booking-123"}'

# Test 4: QR verification
curl -X POST http://localhost:3000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"qrToken": "eyJhbGc..."}'
```

---

## TROUBLESHOOTING AUTOMATION ISSUES

### Issue 1: Auto-booking keeps failing

**Check:**
```typescript
// Verify theatre API endpoint is correct
curl -X GET https://your-theatre-api.com/health

// Check if API key is valid
console.log(process.env.THEATRE_API_KEY);

// Test timeout setting
AUTO_BOOKING_TIMEOUT should be 30000+ ms
```

### Issue 2: QR codes not generating

**Check:**
```typescript
// Verify JWT secret exists
console.log(process.env.QR_JWT_SECRET);

// Test JWT generation
const token = jwt.sign(payload, process.env.QR_JWT_SECRET);

// Check qrcode library installed
npm list qrcode
```

### Issue 3: Emails not sending

**Check:**
```typescript
// Verify SMTP credentials
curl -X telnet smtp.gmail.com 587

// Check Gmail app password (not regular password)
// Enable 2FA in Gmail

// Verify "Less secure apps" allowed
```

### Issue 4: Fraud detection false positives

**Adjust settings:**
```env
# Increase threshold (more permissive)
FRAUD_ALERT_THRESHOLD=80  # Default was 70

# Or whitelist patterns:
FRAUD_IGNORE_PATTERNS=education,gift,bulk
```

---

## QUICK REFERENCE: API ENDPOINTS

| Endpoint | Method | Purpose | Auto? |
|----------|--------|---------|-------|
| `/api/booking/auto-book` | POST | Auto-book with fallback | ✓ |
| `/api/payments` | POST | Create payment order | ✓ |
| `/api/payments` | PUT | Verify payment | ✓ |
| `/api/qr/generate` | POST | Generate QR code | ✓ |
| `/api/qr/verify` | POST | Verify at entry | ✓ |
| `/api/fraud-detection` | POST | Check fraud | ✓ |
| `/api/email-notifications` | POST | Send email | ✓ |

---

## PRODUCTION CHECKLIST

Before deploying automation to production:

- [ ] All environment variables configured
- [ ] Database tables created and tested
- [ ] Theatre APIs integrated and tested
- [ ] Payment gateway live credentials added
- [ ] Email SMTP working
- [ ] QR generation tested
- [ ] Fraud detection thresholds calibrated
- [ ] Monitoring & alerting set up
- [ ] Error logging enabled
- [ ] Backup & recovery procedures documented
- [ ] Security audit completed
- [ ] Load testing done (simulate 1000+ concurrent bookings)

---

This automation system handles your entire booking process end-to-end with zero manual intervention!
