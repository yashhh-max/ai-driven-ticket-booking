# AUTOMATION IMPLEMENTATION CHECKLIST
## Complete Step-by-Step Setup (Follow in Order)

---

## PHASE 1: PREPARATION (Day 1)

### ✅ Step 1: Get External Accounts & Credentials

- [ ] **Razorpay Account** (Payment Processing)
  - Go to: https://razorpay.com
  - Sign up with company details
  - Get: KEY_ID and KEY_SECRET
  - Save to: `.env.local` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
  
- [ ] **Gmail App Password** (Email Automation)
  - Go to: https://myaccount.google.com/apppasswords
  - Enable 2-Factor Authentication first
  - Generate app-specific password
  - Save to: `.env.local` as `SMTP_PASSWORD`

- [ ] **Supabase Database** (Already have it)
  - Confirm your database URL exists
  - Test connection: `npx supabase status`

### ✅ Step 2: Install Dependencies

```bash
# Run in terminal
npm install jsonwebtoken qrcode razorpay nodemailer
npm install -D @types/jsonwebtoken @types/qrcode

# Verify installation
npm list jsonwebtoken qrcode razorpay nodemailer
```

- [ ] All packages installed successfully

### ✅ Step 3: Create Environment Variables File

Create `.env.local` in project root:

```bash
cat > .env.local << 'EOF'
# Auto-Booking Configuration
NEXT_PUBLIC_AUTO_BOOKING_ENABLED=true
AUTO_BOOKING_TIMEOUT=30000
AUTO_BOOKING_RETRY_COUNT=3

# Payment Gateway (Get from Razorpay)
RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=XXXXX

# QR Code (Generate random secret)
QR_JWT_SECRET=XXXXX_GENERATE_RANDOM_XXXXX
QR_EXPIRATION_HOURS=4

# Fraud Detection
FRAUD_DETECTION_ENABLED=true
FRAUD_ALERT_THRESHOLD=70

# Email Service (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@moviebooker.com

# Database
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF
```

**Fill in the XXXXX values:**
- [ ] `RAZORPAY_KEY_ID` = from Razorpay dashboard
- [ ] `RAZORPAY_KEY_SECRET` = from Razorpay dashboard
- [ ] `QR_JWT_SECRET` = run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `SMTP_PASSWORD` = Gmail app password
- [ ] Database URLs = from Supabase

### ✅ Step 4: Test Environment Variables

```bash
# Run this to verify all variables are loaded
node -e "
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✓' : '✗');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓' : '✗');
console.log('QR_JWT_SECRET:', process.env.QR_JWT_SECRET ? '✓' : '✗');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✓' : '✗');
"
```

- [ ] All environment variables loaded (should see ✓ for all)

---

## PHASE 2: DATABASE SETUP (Day 2)

### ✅ Step 5: Create Required Tables

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire content from below
4. Paste and execute

```sql
-- 1. Fraud Alerts Table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  risk_score NUMERIC(5, 2) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  alert_type VARCHAR(100),
  reasons TEXT[],
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_fraud_alerts_booking_id ON fraud_alerts(booking_id);
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);

-- 2. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  email_type VARCHAR(100),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);

-- 3. QR Codes Table
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

CREATE INDEX idx_qr_codes_booking_id ON qr_codes(booking_id);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);

-- 4. Theatre Preferences Table
CREATE TABLE IF NOT EXISTS theatre_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theatre_id UUID NOT NULL REFERENCES theatres(id),
  preference_order INT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, theatre_id)
);

CREATE INDEX idx_theatre_preferences_user_id ON theatre_preferences(user_id);
```

- [ ] Tables created in Supabase

### ✅ Step 6: Add Theatre API Configuration

In Supabase, run:

```sql
-- Add API columns to theatres table (if not exists)
ALTER TABLE theatres ADD COLUMN IF NOT EXISTS (
  api_endpoint VARCHAR(500),
  api_key VARCHAR(500),
  is_auto_booking_enabled BOOLEAN DEFAULT true
);

-- Add sample theatre data
INSERT INTO theatres (name, api_endpoint, api_key, is_auto_booking_enabled)
VALUES
  ('PVR Cinemas', 'https://pvr-api.example.com/book', 'pvr-key-123', true),
  ('IMAX Theatre', 'https://imax-api.example.com/book', 'imax-key-456', true),
  ('Sathyam Cinemas', 'https://sathyam-api.example.com/book', 'sathyam-key-789', true)
ON CONFLICT (name) DO UPDATE SET
  api_endpoint = EXCLUDED.api_endpoint,
  api_key = EXCLUDED.api_key;
```

- [ ] Theatres configured with API endpoints

---

## PHASE 3: CODE INTEGRATION (Day 3)

### ✅ Step 7: Copy Code Files

Copy the provided code examples from `AUTOMATION_QUICK_START.md` into these files:

| File | Content | Created? |
|------|---------|----------|
| `components/AutoBookingForm.tsx` | Example 1 | [ ] |
| `app/checkout/[bookingId]/page.tsx` | Example 2 | [ ] |
| `app/confirmation/[bookingId]/page.tsx` | Example 3 | [ ] |
| `lib/services/fraud-detection.ts` | Example 4 | [ ] |
| `lib/services/email-service.ts` | Example 5 | [ ] |

**How to copy:**
1. Create file with proper path
2. Copy code from AUTOMATION_QUICK_START.md
3. Paste into file
4. Save

### ✅ Step 8: Import Razorpay Script

Add this to `app/layout.tsx`:

```html
<!-- In <head> -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

- [ ] Razorpay script added

### ✅ Step 9: Update Booking Page

Add auto-booking component to your main booking page:

```typescript
// In app/book/page.tsx or similar
import { AutoBookingForm } from '@/components/AutoBookingForm';

export default function BookPage() {
  return (
    <div>
      <h1>Book Your Ticket</h1>
      <AutoBookingForm />
    </div>
  );
}
```

- [ ] Auto-booking component integrated

---

## PHASE 4: TESTING (Day 4)

### ✅ Step 10: Test Auto-Booking

```bash
# Test 1: Start dev server
npm run dev

# Test 2: Open browser
# http://localhost:3000

# Test 3: Try auto-booking
# Fill form and click "Auto-Book"
```

**Expected result:**
- Form submits ✓
- API called ✓
- Booking attempted at first theatre ✓
- Result displayed ✓

- [ ] Auto-booking flow works

### ✅ Step 11: Test Payment Processing

```bash
# Test with Razorpay test credentials
# Use card: 4111 1111 1111 1111
# Any future expiry date
# Any CVV

# Expected result:
# - Payment popup opens ✓
# - Payment succeeds ✓
# - Booking status changes to 'confirmed' ✓
```

- [ ] Payment processing works

### ✅ Step 12: Test QR Generation

```bash
# After successful payment:
# - QR code appears on confirmation page ✓
# - QR can be downloaded ✓
# - QR can be printed ✓
```

- [ ] QR code generation works

### ✅ Step 13: Test Email Sending

```bash
# Test script
node scripts/test-email.js

# OR manually trigger via API:
curl -X POST http://localhost:3000/api/email-notifications/send-test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'

# Check inbox for test email
```

- [ ] Email sending works

### ✅ Step 14: Test Fraud Detection

```bash
# Create a test booking
# Check admin dashboard: /admin/fraud-alerts

# Expected:
# - Fraud analysis runs ✓
# - Risk score calculated ✓
# - Alerts displayed ✓
```

- [ ] Fraud detection works

---

## PHASE 5: PRODUCTION CHECKLIST (Day 5)

### ✅ Step 15: Final Configuration

- [ ] Environment variables updated with production credentials
- [ ] Razorpay changed to live credentials (not test mode)
- [ ] Email SMTP verified for production volume
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Performance monitoring setup
- [ ] CDN configured for images

### ✅ Step 16: Security Audit

- [ ] All secrets in `.env.local` (not in code)
- [ ] `.gitignore` includes `.env.local`
- [ ] CORS headers properly configured
- [ ] API endpoints have rate limiting
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### ✅ Step 17: Load Testing

```bash
# Simulate 100 concurrent bookings
loadtest -c 100 -n 1000 http://localhost:3000/api/booking/auto-book

# Expected:
# - <200ms response time
# - <5% error rate
# - No database crashes
```

- [ ] System handles load

### ✅ Step 18: Create Monitoring Dashboard

Set up monitoring for:
- [ ] Auto-booking success rate
- [ ] Payment verification status
- [ ] QR generation time
- [ ] Email delivery rate
- [ ] Fraud alert frequency
- [ ] System uptime

### ✅ Step 19: Documentation & Training

- [ ] README updated with automation features
- [ ] Admin guide created for fraud alerts
- [ ] User guide created for QR tickets
- [ ] Support team trained
- [ ] Error handling documents created

---

## PHASE 6: DEPLOYMENT (Day 6)

### ✅ Step 20: Deploy to Production

```bash
# 1. Commit all changes
git add -A
git commit -m "Add complete booking automation system"

# 2. Deploy to Vercel
vercel --prod

# 3. Run database migrations on production
npx supabase db push --linked

# 4. Verify all systems working
npm run verify:production
```

- [ ] Deployed to production

### ✅ Step 21: Post-Deployment Checks

- [ ] Auto-booking working in production
- [ ] Payments processing successfully
- [ ] QR codes generating correctly
- [ ] Emails delivering to users
- [ ] Fraud detection active
- [ ] No error logs
- [ ] Performance metrics normal

---

## QUICK TROUBLESHOOTING

**Problem: Auto-booking keeps failing**
```bash
# Check theatre API connection
curl -X GET https://your-theatre-api.com/health
# If fails, update API endpoint in database
```

**Problem: QR codes not generating**
```bash
# Check JWT secret exists
echo $QR_JWT_SECRET
# If empty, regenerate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Problem: Emails not sending**
```bash
# Check SMTP configuration
node scripts/test-email.js
# If fails, verify Gmail 2FA and app password
```

**Problem: Payments failing**
```bash
# Check Razorpay credentials
echo $RAZORPAY_KEY_ID
# Verify in Razorpay dashboard: https://dashboard.razorpay.com
```

---

## FINAL SUMMARY

After completing all steps, you will have:

✅ **Auto-Booking System** - Books at multiple theatres automatically  
✅ **Payment Automation** - Secure Razorpay integration with signature verification  
✅ **QR Ticketing** - Automatic QR generation and verification  
✅ **Email Notifications** - Automatic confirmation and reminder emails  
✅ **Fraud Detection** - Real-time fraud analysis and alerting  
✅ **Complete Monitoring** - Dashboard to track all automation  

**Total Setup Time: ~2-3 days**  
**Production Ready: Yes**  

---

**Need Help?** Check:
- `AUTOMATION_SETUP_GUIDE.md` - Detailed explanations
- `AUTOMATION_QUICK_START.md` - Code examples
- `AUTOMATION_EXPLAINED_FOR_PANEL.md` - How to explain to panel

---

🎉 **You now have a complete automated booking system!**
