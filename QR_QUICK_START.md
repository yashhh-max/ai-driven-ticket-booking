# QR Code System - Quick Start Checklist

## ⚡ 5-Minute Setup

### 1. Install Dependencies (1 min)
```bash
cd c:\Users\yashwanth\Downloads\ai-driven-ticket-booking
pnpm add jsonwebtoken qrcode
pnpm add -D @types/jsonwebtoken @types/qrcode
```

### 2. Configure Environment (1 min)
Add to `.env.local`:
```bash
QR_JWT_SECRET=your-32-char-random-secret-here
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Create Database Tables (1 min)
1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy content from: `scripts/002_create_qr_code_schema.sql`
4. Execute the script
5. Verify tables created: `booking_qr_codes`, `qr_scan_logs`

### 4. Test API (1 min)
```bash
# Generate QR
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "test-booking-uuid"}'

# Verify QR
curl -X POST http://localhost:3000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"qrToken": "eyJhbGc..."}'
```

### 5. Integration (1 min)
- Review: `INTEGRATION_TEMPLATE_QR_BOOKING.ts`
- Integrate QR generation into your booking confirmation endpoint
- Test end-to-end

---

## 📍 File Locations

| File | Purpose |
|------|---------|
| `lib/services/qr-code.ts` | QR token + image generation |
| `lib/services/qr-database.ts` | Database operations |
| `lib/hooks/use-qr-code.ts` | React hooks for frontend |
| `app/api/qr/generate/route.ts` | Generate QR endpoint |
| `app/api/qr/verify/route.ts` | Verify QR endpoint |
| `scripts/002_create_qr_code_schema.sql` | Database schema |
| `lib/types.ts` | Type definitions (updated) |
| `QR_CODE_INTEGRATION_GUIDE.md` | Full documentation |
| `QR_CODE_SYSTEM_SUMMARY.md` | Implementation summary |
| `INTEGRATION_TEMPLATE_QR_BOOKING.ts` | Code examples |

---

## 🧪 Quick Test Flow

### Test 1: Generate QR
```bash
# Call POST /api/qr/generate with confirmed booking
# Expected: QR token + base64 image
```

### Test 2: Decode QR
```bash
# Call GET /api/qr/verify?token=<qr_token>
# Expected: Booking details without marking as used
```

### Test 3: Verify QR
```bash
# Call POST /api/qr/verify with qr_token
# Expected: Success + marked as used in DB
```

### Test 4: Duplicate Scan
```bash
# Call POST /api/qr/verify with same qr_token again
# Expected: "QR Already Used" error
```

---

## 🔧 Configuration Guide

### Change QR Expiration
**File**: `lib/services/qr-code.ts` line ~38
```typescript
expiresIn: '4h' // Change to '6h', '2h', etc.
```

### Change QR Image Size
**File**: `lib/services/qr-code.ts` generateQRImage()
```typescript
width: 300 // Change to 256, 400, etc.
```

### Add More Data to QR Token
**File**: `lib/services/qr-code.ts` QRPayload interface
```typescript
interface QRPayload {
  bookingId: string;
  // Add more fields here
  customerName?: string;
  totalAmount?: number;
}
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `QR_JWT_SECRET not set` | Add to `.env.local`, restart dev server |
| `Module not found: jsonwebtoken` | Run `pnpm add jsonwebtoken` |
| `Module not found: qrcode` | Run `pnpm add qrcode` |
| `Table booking_qr_codes not found` | Run SQL migration script |
| `Token verification failed` | Check if token is expired or JWT secret mismatch |
| `QR Already Used` | Expected - QR can only be scanned once |
| `Booking not confirmed` | Only confirmed bookings can have QR codes |

---

## 📊 Monitoring

### Check QR Code Health
```sql
SELECT COUNT(*) as total,
       SUM(CASE WHEN qr_used = true THEN 1 ELSE 0 END) as used,
       SUM(CASE WHEN qr_used = false THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN qr_expires_at < now() THEN 1 ELSE 0 END) as expired
FROM booking_qr_codes;
```

### View Recent Scans
```sql
SELECT * FROM qr_scan_logs ORDER BY scanned_at DESC LIMIT 10;
```

### View Verification Stats
```sql
SELECT * FROM qr_verification_stats ORDER BY scan_date DESC;
```

---

## 🔐 Security Checklist

- [ ] `QR_JWT_SECRET` is 32+ characters random
- [ ] `QR_JWT_SECRET` is NOT in version control
- [ ] Database tables have RLS enabled
- [ ] HTTPS enabled in production
- [ ] Rate limiting on `/api/qr/verify` endpoint
- [ ] Staff authentication required for scanning
- [ ] Audit logs enabled (`qr_scan_logs`)
- [ ] Regular backups of QR tables

---

## 🎯 Integration Points

### In Booking Confirmation Flow
```typescript
// After payment confirmation, add:
const qrResult = await generateBookingQRCode(...);
const saved = await saveBookingQRCode(...);
// Return QR data to client
```

### In User Dashboard
```typescript
// Show previous bookings with QR codes:
const qr = await getBookingQRCode(bookingId);
// Display qr.qrCodeImage, qr.qrExpiresAt
```

### In Theatre Entry System
```typescript
// Staff scanner interface:
const verification = await verifyQR(scannedToken);
// Show booking details or error
```

---

## 📚 Documentation

| Document | Read If... |
|----------|-----------|
| `QR_CODE_SYSTEM_SUMMARY.md` | You want an overview |
| `QR_CODE_INTEGRATION_GUIDE.md` | You need detailed instructions |
| `INTEGRATION_TEMPLATE_QR_BOOKING.ts` | You need code examples |
| This file | You want a quick checklist |

---

## 🧠 How It Works (30-Second Version)

1. **User books ticket** → Booking created with `status = pending`
2. **Payment confirmed** → Booking status = `confirmed`
3. **QR generated** → JWT token created with booking details, 4-hour expiry
4. **QR image created** → PNG generated from token
5. **QR saved to DB** → Stored with booking reference
6. **QR shown to user** → Display in email, SMS, app, print
7. **User scans at entry** → Staff reads QR code
8. **QR verified** → JWT validated, booking checked, marked as used
9. **Entry allowed** → Booking details displayed, entry logged

---

## 🏁 Success Indicators

✅ When successfully integrated, you should see:

- QR code generates within 1-2 seconds of booking confirmation
- QR displays correctly in all formats (email, app, print)
- Staff can scan and verify QR in under 5 seconds
- No duplicate entries possible (already-used prevention)
- Error messages clearly indicate why QR failed validation
- Audit logs show all scan attempts
- Reports available for analytics

---

## 🔄 Maintenance Tasks

### Weekly
```sql
-- Clean up expired QR codes
DELETE FROM booking_qr_codes 
WHERE qr_expires_at < NOW() AND qr_used = false;
```

### Monthly
```sql
-- View usage statistics
SELECT DATE(scanned_at), COUNT(*) FROM qr_scan_logs 
GROUP BY DATE(scanned_at) ORDER BY DATE DESC;
```

### Quarterly
- Review security logs
- Update JWT secret (rotate if needed)
- Archive old scan logs for compliance

---

## 💡 Pro Tips

1. **Increase QR Size** - Use `width: 500` for mobile scanning
2. **Add Branding** - Customize colors in `generateQRImage()`
3. **Cache QR Images** - Store base64 in Redis for faster retrieval
4. **Batch Operations** - Use transaction batching for bulk QR generation
5. **Offline Scanning** - QR verification can work offline with sync
6. **Mobile App** - Use React Native's `expo-qr-code` for app scanning

---

## 📞 Support

**For detailed help:**
- Full Guide: `QR_CODE_INTEGRATION_GUIDE.md`
- Code Examples: `INTEGRATION_TEMPLATE_QR_BOOKING.ts`
- System Overview: `QR_CODE_SYSTEM_SUMMARY.md`

**For specific issues:**
- Check logs: `app/api/qr/*/route.ts`
- Database: `booking_qr_codes`, `qr_scan_logs` tables
- Tests: Use curl commands in Quick Test Flow section

---

## ✨ What's Included

- ✅ Production-ready code
- ✅ Full error handling
- ✅ TypeScript types
- ✅ React hooks
- ✅ API endpoints
- ✅ Database schema
- ✅ Security RLS policies
- ✅ Audit logging
- ✅ Documentation
- ✅ Testing examples

---

**Total Setup Time: ~30 minutes**
(5 min setup + 10 min database + 10 min integration + 5 min testing)

**You're ready to go! 🚀**
