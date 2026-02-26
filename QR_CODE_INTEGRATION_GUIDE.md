# QR Code System - Integration Guide

## Overview

This guide explains how to integrate the QR code generation and verification system into your movie ticket booking application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING FLOW WITH QR                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User completes booking (seats selected, amount paid)     │
│  2. Booking confirmed and saved to database                  │
│  3. QR code generated with JWT token (4hr validity)          │
│  4. QR code stored in database                               │
│  5. QR code displayed to user (email, SMS, in-app)           │
│  6. User scans QR at theatre entry                           │
│  7. Staff verifies QR (checks if valid, not used)            │
│  8. Mark QR as used, record entry in audit log               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. QR Generation Service (`lib/services/qr-code.ts`)

**Exports:**
- `generateQRToken(payload)` - Creates JWT token
- `verifyQRToken(token)` - Validates JWT and extracts payload
- `generateQRImage(token)` - Creates PNG image from token
- `generateBookingQRCode(...)` - Main entry point: generates complete QR
- `decodeQRTokenWithoutVerification(token)` - Peek at token data
- `isTokenExpired(token)` - Check expiration status
- `getTokenTimeRemaining(token)` - Get time until expiry

**Key Features:**
- HS256 JWT algorithm (secure, no dependencies on external services)
- 4-hour expiration (configured: adjust `expiresIn: '4h'`)
- High error correction level H (best for scanning reliability)
- Includes booking details: bookingId, userId, theatreId, showDate, showTime, seats

### 2. Database Service (`lib/services/qr-database.ts`)

**Exports:**
- `saveBookingQRCode()` - Store QR after generation
- `getBookingQRCode()` - Retrieve QR for a booking
- `markQRAsUsed()` - Mark as used after scanning
- `getBookingDetails()` - Get booking info
- `deleteBookingQRCode()` - Remove QR (for cancelled bookings)
- `getScannedQRsReport()` - Analytics

**Operations:**
- Validates booking status (confirmed only)
- Checks if QR already used
- Creates audit trail in `qr_scan_logs`
- Updates `booking_qr_codes` table

### 3. API Endpoints

#### Generate QR: `POST /api/qr/generate`

**Request:**
```json
{
  "bookingId": "uuid-of-booking"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "QR Code Generated Successfully",
  "data": {
    "bookingId": "uuid",
    "qrToken": "eyJhbGc...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KG...",
    "expiresAt": "2026-02-19T20:30:00.000Z",
    "expiresInHours": 4
  }
}
```

**Usage: Generate after booking confirmation**
```typescript
// In your booking completion flow (after payment)
const generateQRResponse = await fetch('/api/qr/generate', {
  method: 'POST',
  body: JSON.stringify({ bookingId: confirmationData.bookingId })
});

const result = await generateQRResponse.json();
if (result.success) {
  // Display QR to user: result.data.qrCodeImage
}
```

#### Retrieve QR: `GET /api/qr/generate?bookingId=<id>`

**Response:**
```json
{
  "success": true,
  "message": "QR Code Retrieved Successfully",
  "data": {
    "bookingId": "uuid",
    "qrToken": "eyJhbGc...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KG...",
    "expiresAt": "2026-02-19T20:30:00.000Z",
    "isUsed": false,
    "scannedAt": null,
    "generatedAt": "2026-02-19T16:30:00.000Z"
  }
}
```

#### Verify QR: `POST /api/qr/verify`

**Request:**
```json
{
  "qrToken": "eyJhbGc...",
  "staffId": "uuid-of-staff-optional"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "QR Verified Successfully",
  "bookingDetails": {
    "bookingId": "uuid",
    "userId": "uuid",
    "status": "confirmed",
    "showDate": "2026-02-20",
    "showTime": "19:00",
    "seats": ["A1", "A2"],
    "totalAmount": 500
  }
}
```

**Response (Already Used):**
```json
{
  "success": false,
  "message": "QR Already Used",
  "error": "This ticket has already been scanned"
}
```

**Response (Invalid/Expired):**
```json
{
  "success": false,
  "message": "Ticket Expired",
  "error": "QR code has expired (valid for 4 hours after booking)"
}
```

---

## Integration Steps

### Step 1: Set up Environment Variables

Add to `.env.local`:
```bash
QR_JWT_SECRET=your-long-secure-random-secret-key-min-32-chars
```

Generate secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Install Dependencies

```bash
pnpm add jsonwebtoken qrcode
pnpm add -D @types/jsonwebtoken @types/qrcode
```

If already installed, verify in `package.json`:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "qrcode": "^1.5.3"
  }
}
```

### Step 3: Create Database Tables

Run the migration script in Supabase:

```sql
-- From: scripts/002_create_qr_code_schema.sql
-- Copy and paste into Supabase SQL Editor
-- This creates:
-- - booking_qr_codes table
-- - qr_scan_logs table
-- - RLS policies
-- - Indexes and audit triggers
```

### Step 4: Update Booking Confirmation Flow

**Location**: `app/api/payments/route.ts` or your booking confirmation endpoint

After updating booking status to `confirmed`:

```typescript
// After booking is confirmed and saved
import { generateBookingQRCode } from '@/lib/services/qr-code';
import { saveBookingQRCode } from '@/lib/services/qr-database';

// Generate QR code
const qrResult = await generateBookingQRCode(
  bookingId,
  userId,
  theatreId,
  showDate,
  showTime,
  selectedSeats
);

// Save to database
const saveResult = await saveBookingQRCode(
  bookingId,
  userId,
  qrResult.token,
  qrResult.qrDataUrl,
  qrResult.expiresAt
);

if (saveResult.success) {
  // QR ready for user
}
```

### Step 5: Display QR to User

**In Booking Confirmation Page**:

```typescript
'use client'

import { useQRCode } from '@/lib/hooks/use-qr-code';
import { useEffect, useState } from 'react';

export function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const { getQR, loading, error } = useQRCode();
  const [qrData, setQrData] = useState<any>(null);

  useEffect(() => {
    const fetchQR = async () => {
      const result = await getQR(bookingId);
      if (result.success && result.data) {
        setQrData(result.data);
      }
    };
    fetchQR();
  }, [bookingId]);

  if (loading) return <div>Loading QR code...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Ticket QR Code</h2>
      {qrData && (
        <>
          <img 
            src={qrData.qrCodeImage} 
            alt="Booking QR Code"
            style={{ width: '300px', height: '300px' }}
          />
          <p>Valid until: {new Date(qrData.expiresAt).toLocaleString()}</p>
          <p>Booking ID: {qrData.bookingId}</p>
        </>
      )}
    </div>
  );
}
```

### Step 6: Theatre Entry - QR Verification

**Admin/Staff Scanner Interface**:

```typescript
'use client'

import { useQRVerification } from '@/lib/hooks/use-qr-code';
import { useState } from 'react';

export function QRScanner() {
  const { verifyQR, loading, error } = useQRVerification();
  const [qrToken, setQrToken] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    const verifyResult = await verifyQR(qrToken);
    setResult(verifyResult);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Paste QR token or scan QR code"
        value={qrToken}
        onChange={(e) => setQrToken(e.target.value)}
      />
      <button onClick={handleScan} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Ticket'}
      </button>

      {result && (
        <div>
          {result.success ? (
            <div className="success">
              <h3>✓ Ticket Verified</h3>
              <p>Booking: {result.bookingDetails.bookingId}</p>
              <p>Seats: {result.bookingDetails.seats.join(', ')}</p>
              <p>Total: ₹{result.bookingDetails.totalAmount}</p>
            </div>
          ) : (
            <div className="error">
              <h3>✗ {result.message}</h3>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Frontend Components

### QR Display Component

```typescript
// components/qr-display.tsx
interface QRDisplayProps {
  qrToken: string;
  bookingId: string;
  expiresAt: string;
}

export function QRDisplay({ qrToken, bookingId, expiresAt }: QRDisplayProps) {
  const timeRemaining = new Date(expiresAt).getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="qr-display">
      <div className="qr-container">
        {/* Generate QR image from token on client if needed */}
        {/* Or use pre-generated qrCodeImage from API */}
      </div>
      <div className="qr-info">
        <h3>Your Entry Ticket</h3>
        <p>Booking ID: {bookingId}</p>
        <p className="expiry">
          Expires in: {hoursRemaining}h {minutesRemaining}m
        </p>
        <button onClick={() => window.print()}>Print Ticket</button>
        <button onClick={() => {/* Send via email/SMS */}}>Share QR</button>
      </div>
    </div>
  );
}
```

---

## Database Schema Reference

### `booking_qr_codes` Table
```sql
- id: UUID (Primary Key)
- booking_id: UUID (Unique, FK to bookings)
- user_id: UUID (FK to auth.users)
- qr_token: TEXT (JWT token)
- qr_code_image: BYTEA (Base64 PNG)
- qr_generated_at: TIMESTAMP
- qr_expires_at: TIMESTAMP
- qr_used: BOOLEAN (default: false)
- qr_scanned_at: TIMESTAMP (nullable)
- qr_scanned_by: UUID (nullable, FK to auth.users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `qr_scan_logs` Table (Audit Trail)
```sql
- id: UUID (Primary Key)
- booking_id: UUID (FK to bookings)
- user_id: UUID
- scanned_at: TIMESTAMP
- scanned_by: UUID (nullable)
- status: VARCHAR (success, failed, already_used, invalid_token)
- error_message: TEXT (nullable)
- device_info: JSONB (nullable)
- created_at: TIMESTAMP
```

---

## Configuration & Customization

### Change QR expiration time

**File**: `lib/services/qr-code.ts` (line ~38)

```typescript
// Change from '4h' to any duration
const token = jwt.sign(payload, secret, {
  expiresIn: '6h', // Change to 6 hours
  algorithm: 'HS256',
});
```

### Change QR image size/quality

**File**: `lib/services/qr-code.ts` (generateQRImage function)

```typescript
const qrDataUrl = await QRCode.toDataURL(token, {
  errorCorrectionLevel: 'H', // High error correction
  type: 'image/png',
  quality: 0.95,
  margin: 2,
  width: 300, // Change size (pixels)
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
});
```

### Add additional data to QR token

**File**: `lib/services/qr-code.ts` (QRPayload interface)

```typescript
interface QRPayload {
  bookingId: string;
  userId: string;
  theatreId: string;
  showDate: string;
  showTime: string;
  seats: string[];
  // Add more fields:
  movieTitle?: string;
  customerName?: string;
  totalAmount?: number;
}
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `QR_JWT_SECRET not configured` | Missing env var | Add to `.env.local` |
| `Token verification failed` | Invalid/expired token | Ask user to generate new QR |
| `QR Already Used` | Duplicate scan | Log attempt, check last scan time |
| `Invalid Booking Status` | Booking not confirmed | Ensure booking is confirmed before generating QR |
| `Ticket Expired` | QR older than 4 hours | Generate new QR via API |

---

## Testing

### Test QR Generation
```bash
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "your-booking-uuid"}'
```

### Test QR Verification
```bash
curl -X POST http://localhost:3000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"qrToken": "eyJhbGc..."}'
```

### Test QR Preview
```bash
curl http://localhost:3000/api/qr/verify?token=eyJhbGc...
```

---

## Analytics & Reporting

### View Scanning Statistics

**Query**: `SELECT * FROM qr_verification_stats;`

Shows daily scans, successful vs failed, duplicates, etc.

### View QR Status Overview

**Query**: `SELECT * FROM booking_qr_status_overview;`

Shows total QR codes, active, used, expired, etc.

### Get Scanned QRs Report

```typescript
import { getScannedQRsReport } from '@/lib/services/qr-database';

const report = await getScannedQRsReport('2026-02-01', '2026-02-28');
```

---

## Security Considerations

✅ **Implemented:**
- JWT token signing (HS256 with secret)
- 4-hour expiration on tokens
- Booking status verification
- Duplicate use prevention
- User ownership validation
- RLS policies on database tables
- Audit trail of all scans

✅ **Best Practices:**
- Never expose JWT_SECRET in client-side code
- Verify user authentication before operations
- Use HTTPS in production
- Implement rate limiting on verify endpoint
- Log all scanning attempts
- Regularly cleanup expired QR codes (via cron job)

⚠️ **Additional Hardening:**
- Add IP-based rate limiting
- Implement 2FA for staff scanner access
- Add device fingerprinting
- Encrypt QR token in transit
- Use rotating JWT secrets

---

## Troubleshooting

### QR Not Generated After Booking Confirmation
- Check if booking status is `confirmed`
- Verify `QR_JWT_SECRET` env var is set
- Check server logs for errors
- Ensure `booking_qr_codes` table exists

### QR Verification Always Fails
- Verify JWT secret matches
- Check if token is expired
- Ensure booking exists in database
- Check booking_status is `confirmed`

### QR Code Image Not Loading
- Verify `qrcode` package is installed
- Check if token is valid
- Try regenerating QR code

---

## Production Checklist

- [ ] Database tables created via migration script
- [ ] Environment variables configured
- [ ] `jsonwebtoken` and `qrcode` packages installed
- [ ] QR generation integrated into booking flow
- [ ] Frontend displays QR after confirmation
- [ ] Staff interface for QR scanning implemented
- [ ] Rate limiting added to verify endpoint
- [ ] Audit logging enabled
- [ ] Error handling tested
- [ ] HTTPS enabled in production
- [ ] Backup/restore procedure documented
- [ ] Monitoring configured for QR failures

---

## Support & Maintenance

### Monitoring Endpoints
- Monitor `/api/qr/generate` - POST success rate
- Monitor `/api/qr/verify` - POST response times
- Query `qr_scan_logs` for failure patterns

### Cleanup Jobs
```sql
-- Delete expired QR codes (run daily)
DELETE FROM booking_qr_codes
WHERE qr_expires_at < CURRENT_TIMESTAMP
AND qr_used = FALSE;

-- Archive old scan logs (run weekly)
DELETE FROM qr_scan_logs
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
```

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set environment variables
3. ✅ Run database migration
4. ✅ Integrate QR generation into booking flow
5. ✅ Implement frontend display
6. ✅ Set up staff scanner interface
7. ✅ Test end-to-end flow
8. ✅ Deploy to production
9. ✅ Monitor and maintain
