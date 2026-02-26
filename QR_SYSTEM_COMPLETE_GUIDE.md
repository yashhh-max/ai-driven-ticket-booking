# QR Code System - Complete Setup & Troubleshooting Guide

## 🎯 Current Status

Your QR code system is **FULLY IMPLEMENTED** but requires **environment variable configuration** to work.

### What's Already Done ✅
- QR token generation (JWT-based, secure, 4-hour expiry)
- QR image generation (PNG format, high quality)
- Database schema with RLS policies
- API endpoints (POST to generate, GET to retrieve)
- Checkout integration (triggers QR generation after payment)
- Confirmation page display (shows QR with auto-retry)
- Admin client for bypassing RLS policies
- Comprehensive error logging throughout

### What's Missing ❌
- **QR_JWT_SECRET** environment variable
- **SUPABASE_SERVICE_ROLE_KEY** environment variable

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Set QR_JWT_SECRET

Generate a random 32-character secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output.

### Step 2: Get SUPABASE_SERVICE_ROLE_KEY

1. Go to https://app.supabase.com
2. Open your project
3. Click Settings → API
4. Copy the **service_role** key (NOT anon public key)

### Step 3: Update .env.local

Create or edit `.env.local` in your project root:

```env
# QR Code JWT Secret
QR_JWT_SECRET=<paste-your-32-char-secret-here>

# Supabase Service Role Key (for RLS bypass)
SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>
```

### Step 4: Restart Dev Server

```powershell
# Kill current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Verify Setup

### Option 1: Run Diagnostic Script

```powershell
node scripts/check-qr-env.js
```

This will show you exactly what's configured and what's missing.

### Option 2: Manual Check

```powershell
Get-Content .env.local | Select-String "QR_JWT_SECRET|SUPABASE_SERVICE_ROLE_KEY"
```

Both should appear in the output.

---

## 🧪 Test QR Generation

1. **Make a booking** and complete payment
2. **Verify status shows "confirmed"**
3. **Go to confirmation page**
4. **QR should appear within 5 seconds**

If it doesn't:
- Check browser console (F12) for errors
- Check your terminal for `[QR API]` or `[QR Token]` error messages
- Verify both env vars are set
- Restart the dev server

---

## 📋 What Each Environment Variable Does

### QR_JWT_SECRET
- **Purpose:** Signs the JWT token embedded in QR codes
- **Security:** Must be kept secret (never share or commit)
- **Length:** Minimum 32 characters (recommended 32+)
- **Format:** Hex string or random alphanumeric

### SUPABASE_SERVICE_ROLE_KEY
- **Purpose:** Allows the API to save QR codes to database, bypassing RLS
- **Security:** Must be kept secret (never share or commit)
- **Where to find:** Supabase Dashboard → Settings → API → service_role key
- **Important:** Use the `service_role` key, NOT the `anon public` key

---

## 🔄 How QR Generation Works (End-to-End)

### User Books Ticket
```
1. User selects seats
2. Proceeds to checkout
3. Completes payment
4. Booking status → "confirmed"
```

### QR Generation Triggered
```
1. Checkout page calls POST /api/qr/generate
2. API validates booking (must be confirmed, owned by user)
3. API calls generateBookingQRCode()
4. generateQRToken() creates JWT with booking data (needs QR_JWT_SECRET)
5. generateQRImage() converts token to PNG
6. saveBookingQRCode() stores in database (needs admin client)
```

### QR Displayed
```
1. Confirmation page loads
2. Calls GET /api/qr/generate?bookingId=xxx
3. If QR exists, shows it immediately
4. If not, retries every 2 seconds (up to 30 seconds)
5. Shows loading state with progress (Attempt X/15)
```

---

## ⚠️ Common Issues & Solutions

### "QR code generation is taking longer than expected"
**Causes:**
- Missing QR_JWT_SECRET → generateQRToken() throws error
- Missing SUPABASE_SERVICE_ROLE_KEY → database save fails
- Dev server not restarted after env var changes

**Fix:**
1. Check `.env.local` has both variables
2. Restart dev server: `npm run dev`
3. Run diagnostic: `node scripts/check-qr-env.js`

### "QR code not generating, showing error instead"
**Check the error message:**
- If it mentions "QR_JWT_SECRET": Add to `.env.local`
- If it mentions "Service Role": Check SUPABASE_SERVICE_ROLE_KEY
- If it mentions "RLS Policy": System needs admin credentials
- If it mentions "Booking not found": Verify booking is confirmed

### "Timeout after 30 seconds of 'Generating...'"
**This means:**
- The GET request is working (no 404)
- But the QR record isn't in the database
- The POST generation is failing silently

**Solutions:**
1. Check browser console (F12) for error clues
2. Check terminal for `[QR API]` error logs
3. Verify booking status is "confirmed"
4. Verify both env vars are properly set

### "Session expired" error
**Solution:**
- You've been logged out
- Refresh the page
- Log back in
- Try booking again

### "This booking does not belong to your account"
**Solution:**
- Make sure you're logged in as the user who made the booking
- Try a fresh booking
- Log out and back in if confused

---

## 🔍 Debugging Guide

### To Enable Full Logging:

All QR operations log to console with prefixes:
- `[QR API]` - API endpoint logs
- `[QR Token]` - Token generation logs
- `[QR DB]` - Database operation logs
- `[QR Display]` - Client-side display logs

**In browser (F12):**
- Open Console tab
- Look for `[QR Display]` messages
- Watch for errors in red

**In terminal (dev server):**
- Look for `[QR API]` and `[QR DB]` messages
- Red errors show what went wrong

### Example Error Sequence:

```
[QR API] POST request received
[QR API] POST: Processing QR generation request for booking: abc123
[QR API] POST: Fetching booking details for: abc123
[QR Token] QR_JWT_SECRET is not configured
[QR Token] Please add QR_JWT_SECRET to your .env.local file
[QR API] POST: Caught exception: QR_JWT_SECRET environment... 
```

This clearly shows the problem: QR_JWT_SECRET is missing.

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `lib/services/qr-code.ts` | Token & image generation |
| `lib/services/qr-database.ts` | Database operations |
| `lib/supabase/server.ts` | Supabase client factory (includes admin client) |
| `app/api/qr/generate/route.ts` | API endpoints (POST/GET) |
| `components/qr-display.tsx` | Display component with auto-retry |
| `app/checkout/[bookingId]/checkout-client.tsx` | Triggers QR generation |
| `app/confirmation/[bookingId]/page.tsx` | Shows QR on confirmation |
| `scripts/002_create_qr_code_schema.sql` | Database schema |
| `scripts/check-qr-env.js` | Diagnostic script |

---

## 🔐 Security Checklist

- [ ] QR_JWT_SECRET is 32+ characters
- [ ] QR_JWT_SECRET is NEVER committed to Git
- [ ] SUPABASE_SERVICE_ROLE_KEY is NEVER committed to Git
- [ ] .env.local is in .gitignore
- [ ] Service role key is from your Supabase project (not shared account)
- [ ] No one else has access to your .env.local
- [ ] If keys are exposed, regenerate them immediately

---

## 🎓 Expected Behavior After Setup

### Successful QR Generation
1. User completes booking → Payment processed
2. Confirmation page loads
3. QR appears within 2-5 seconds (usually instant)
4. QR shows booking details: Seats (A1, B2, etc.), Date, Time, Cinema
5. User can scan QR at cinema entrance

### What QR Contains (Encoded in JWT Token)
```json
{
  "bookingId": "uuid",
  "userId": "uuid",
  "theatreId": "uuid",
  "showDate": "2024-01-15",
  "showTime": "14:30",
  "seats": ["A1", "B2", "B3"],
  "iat": 1234567890,
  "exp": 1234581290
}
```

---

## 📞 Troubleshooting Checklist

After completing setup, go through this if QR still isn't working:

- [ ] Both env vars in `.env.local`
- [ ] Dev server restarted after creating `.env.local`
- [ ] `.env.local` is in project root (not subfolder)
- [ ] QR_JWT_SECRET is 32+ characters
- [ ] SUPABASE_SERVICE_ROLE_KEY is from Supabase dashboard
- [ ] Booking status shows as "confirmed"
- [ ] Booking was made by logged-in user
- [ ] No errors in browser console (F12)
- [ ] No errors in dev server terminal
- [ ] Ran diagnostic: `node scripts/check-qr-env.js`

---

## 🎉 Next Steps

1. **Set QR_JWT_SECRET** in `.env.local`
2. **Set SUPABASE_SERVICE_ROLE_KEY** in `.env.local`
3. **Restart dev server**
4. **Run diagnostic:** `node scripts/check-qr-env.js`
5. **Test QR generation** with a new booking
6. **Celebrate!** 🎊

---

## 📖 Related Documentation

- [QR_ENV_SETUP.md](QR_ENV_SETUP.md) - Environment variable setup guide
- [QR_SYSTEM_README.md](QR_SYSTEM_README.md) - QR system architecture
- [QR_SETUP_INSTRUCTIONS.md](QR_SETUP_INSTRUCTIONS.md) - Initial setup guide

---

**Last Updated:** Latest implementation with comprehensive error handling and environment variable validation.
