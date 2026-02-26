# 🎯 QR Code Setup - Database Configuration

## ✅ Completed So Far
- [x] Installed `jsonwebtoken` and `qrcode` packages
- [x] Added `QR_JWT_SECRET` to `.env.local`
- [x] Integrated QR generation into payment verification endpoint
- [x] Dev server running

## 🔄 Next Step: Create Database Tables

### Option 1: Quick Setup (Recommended) ⚡

1. **Go to Supabase Dashboard**
   - Open: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left menu
   - Click "New Query"

3. **Copy & Paste SQL Script**
   ```
   Copy the complete content from:
   scripts/002_create_qr_code_schema.sql
   ```

4. **Execute the Script**
   - Click "Run" button
   - Wait for completion (should see green checkmark)

5. **Verify Tables Created**
   - Go to "Table Editor"
   - You should see two new tables:
     - `booking_qr_codes`
     - `qr_scan_logs`

---

### Option 2: Manual Setup (If time-constrained)

If the above doesn't work, here's the minimal SQL to get started:

```sql
-- Minimal QR Code Table
CREATE TABLE IF NOT EXISTS booking_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  qr_token TEXT NOT NULL,
  qr_code_image TEXT NOT NULL,
  qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  qr_expires_at TIMESTAMP NOT NULL,
  qr_used BOOLEAN DEFAULT FALSE,
  qr_scanned_at TIMESTAMP,
  qr_scanned_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_qr_codes_booking_id ON booking_qr_codes(booking_id);
CREATE INDEX idx_booking_qr_codes_user_id ON booking_qr_codes(user_id);
```

---

## 🧪 Test QR Generation

### Test 1: Create a Test Booking & Confirm Payment

1. Open your app at: http://localhost:3000
2. Complete a booking
3. Complete payment
4. Check browser console for QR generation logs

### Test 2: Check QR in Database

```sql
-- Check if QR was created
SELECT * FROM booking_qr_codes LIMIT 5;

-- Should see columns: booking_id, qr_token, qr_code_image, qr_expires_at
```

### Test 3: Test QR API Directly

```bash
# Replace with actual booking ID from your database
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "your-booking-uuid"}'
```

---

## ✨ How QR Generation Works Now

```
User Completes Booking
    ↓
Payment Verification (PUT /api/payments)
    ↓
✓ Signature Verified
    ↓
Booking Status → CONFIRMED
    ↓
🎯 QR GENERATION HAPPENS HERE (NEW!)
    • Generates JWT token with booking details
    • Creates PNG image from token
    • Saves to booking_qr_codes table
    ↓
Return Success Response
    ↓
Display QR to User (in confirmation page)
```

---

## 📊 Verify Setup

### Check 1: Environment Variables
```bash
# Should show the secret (first 10 chars)
echo $env:QR_JWT_SECRET | Select-Object -First 10
```

### Check 2: Packages Installed
```bash
pnpm list jsonwebtoken qrcode
```

### Check 3: API Endpoints Exist
```bash
# Should return 200 OK (even if fails due to no booking)
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check 4: Database Connection
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%qr%';
```

---

## 🐛 Troubleshooting

### Issue: "QR_JWT_SECRET not configured"
**Solution:**
1. Make sure it's in `.env.local` (NOT `.env`)
2. Restart dev server: `pnpm dev`
3. Check: `Get-Content .env.local | Select-String QR_JWT_SECRET`

### Issue: "Module not found: jsonwebtoken"
**Solution:**
```bash
pnpm list jsonwebtoken
# If not there: pnpm add jsonwebtoken qrcode
```

### Issue: "booking_qr_codes table not found"
**Solution:**
- Run the SQL migration script in Supabase
- See "Option 1: Quick Setup" above

### Issue: "QR token not generating"
**Solution:**
1. Check browser admin console for errors
2. Check server logs: `pnpm dev` output
3. Make sure booking is confirmed (status = 'confirmed')

### Issue: "QR code image not showing"
**Solution:**
1. Check if `qr_code_image` column has data in database
2. Try calling GET `/api/qr/generate?bookingId=<id>`
3. Verify qrcode package is installed

---

## 🎯 Next: Display QR to User

Once database is ready, implement QR display in your booking confirmation page:

```typescript
// In your booking confirmation component
import { useQRCode } from '@/lib/hooks/use-qr-code';

export function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const { getQR, loading } = useQRCode();
  const [qr, setQr] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const result = await getQR(bookingId);
      if (result.success) setQr(result.data);
    };
    fetch();
  }, [bookingId]);

  return (
    <div>
      {qr && (
        <img src={qr.qrCodeImage} alt="Booking QR" width="300" />
      )}
    </div>
  );
}
```

---

## ✅ Setup Checklist

- [ ] Packages installed (`jsonwebtoken`, `qrcode`)
- [ ] `QR_JWT_SECRET` added to `.env.local`
- [ ] Dev server restarted
- [ ] SQL migration run in Supabase
- [ ] `booking_qr_codes` table created
- [ ] `qr_scan_logs` table created
- [ ] Payment endpoint updated with QR generation
- [ ] Tested with curl: POST /api/qr/generate
- [ ] Tested with curl: GET /api/qr/generate?bookingId=...
- [ ] Database query: SELECT * FROM booking_qr_codes

---

## 📞 Need Help?

**Check these files:**
- QR_QUICK_START.md - 5-minute quick reference
- QR_CODE_INTEGRATION_GUIDE.md - Complete documentation
- QR_SYSTEM_README.md - Overview and architecture
- INTEGRATION_TEMPLATE_QR_BOOKING.ts - Code examples

---

## 🚀 You're Almost There!

Once database is set up, QR codes will automatically generate when:
1. Payment is completed ✓
2. Booking confirmed ✓
3. QR saved to database ✓
4. Ready to display to user ✓

**Do the following now:**
1. ⬜ Go to Supabase → SQL Editor
2. ⬜ Copy script from `scripts/002_create_qr_code_schema.sql`
3. ⬜ Execute the script
4. ⬜ Come back and test!
