# QR Code System - Environment Variable Setup

## ⚠️ CRITICAL: Your QR Generation is Failing Because of Missing Environment Variables

The QR code generation system requires **TWO** critical environment variables that must be configured before it can work:

### 1️⃣ QR_JWT_SECRET (For Token Signing)
### 2️⃣ SUPABASE_SERVICE_ROLE_KEY (For Database Access)

---

## 🚀 Quick Start Setup (5 minutes)

### Step 1: Generate QR_JWT_SECRET

Open PowerShell and run ONE of these commands:

**Option A: Using Node.js (recommended)**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using OpenSSL (if installed)**
```powershell
openssl rand -base64 32
```

**Option C: Manual (copy one of these 32-char strings)**
```
d8f9e2c1a4b7f3d9e5c8a1b4f7d2e9c3
a2f7e9d1c3b8f5a7d2e4c1b9f6a3d8e5
c5b2a8f1d7e3c9a4b6f2d8e5c1a7b3f9
```

Copy your generated secret - you'll need it next.

---

### Step 2: Get SUPABASE_SERVICE_ROLE_KEY

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Login to your account
   - Select your project for this ticket booking app

2. **Navigate to API Keys**
   - Click "Settings" in the left sidebar
   - Click "API" 
   - Under "Project API keys", find the section with:
     - "anon public" key
     - "service_role" key ← **THIS IS THE ONE YOU NEED**

3. **Copy the service_role key**
   - Click the copy icon next to the `service_role` key
   - Keep it safe (don't share this!)

**Important:** Make sure you're copying the `service_role` key, NOT the `anon public` key!

---

### Step 3: Create/Update .env.local File

1. **Open your project in VS Code**
2. **Create a new file** (if it doesn't exist): `.env.local`
   - Right-click on the project root folder → "New File"
   - Name it `.env.local` (exactly this)

3. **Add these lines** (replace with your actual values):

```env
# QR Code Generation Secret (32+ character random string)
QR_JWT_SECRET=<PASTE_YOUR_GENERATED_SECRET_HERE>

# Supabase Admin Key (for bypassing RLS policies)
SUPABASE_SERVICE_ROLE_KEY=<PASTE_YOUR_SERVICE_ROLE_KEY_HERE>
```

**Example** (with fake values for reference):
```env
QR_JWT_SECRET=a2f7e9d1c3b8f5a7d2e4c1b9f6a3d8e5
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aGFieGNtdGx1ZXVubGpxendvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg0NDEwNiwiZXhwIjoyMDg1NDIwMTA2fQ.1xGdnXMTbiFRDTfE6OEYyQ02rLt6p7aVR9r2LOqkDh0
```

---

### Step 4: Restart Your Dev Server

1. **Stop the current server**
   - If running: Press `Ctrl+C` in the terminal

2. **Start the dev server again**
   ```powershell
   npm run dev
   ```
   or
   ```powershell
   pnpm dev
   ```

3. **Wait for "ready - started server on"** message

---

### Step 5: Test QR Generation

1. **Make a booking** and complete the payment
2. **Go to the confirmation page**
3. **You should see your QR code** displayed within 5 seconds

**If it's still not working:**
- Check the browser console (F12) for error messages
- Check the terminal for error logs
- Verify both environment variables are present in `.env.local`
- Make sure the `.env.local` file is in the root directory (not in a subfolder)

---

## 🔍 Verification Steps

### Check if QR_JWT_SECRET is loaded:
```powershell
# In your terminal, run:
Get-Content .env.local | Select-String QR_JWT_SECRET
```
Should output something like:
```
QR_JWT_SECRET=a2f7e9d1c3b8f5a7d2e4c1b9f6a3d8e5
```

### Check if SUPABASE_SERVICE_ROLE_KEY is loaded:
```powershell
Get-Content .env.local | Select-String SUPABASE_SERVICE_ROLE_KEY
```
Should show your service role key.

---

## ❌ Common Issues & Fixes

### Issue 1: "QR_JWT_SECRET is not configured"
**Solution:**
- [ ] Verify `.env.local` exists in your project root
- [ ] Check that it contains `QR_JWT_SECRET=<value>`
- [ ] Make sure there are no spaces around the `=` sign
- [ ] Restart the dev server with `npm run dev`

### Issue 2: "Cannot save QR to database" / "RLS Policy Error"
**Solution:**
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- [ ] Make sure you copied the `service_role` key, not the `anon public` key
- [ ] Restart the dev server

### Issue 3: QR still showing "Generating..." after 30 seconds
**Solution:**
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Look for red error messages
4. Take a screenshot and check:
   - Does it say "QR_JWT_SECRET not configured"?
   - Does it say "SUPABASE_SERVICE_ROLE_KEY not available"?
   - Or some other error?

### Issue 4: "This booking does not belong to your account"
**Solution:**
- Make sure you're logged in as the same user who made the booking
- Try logging out and back in

---

## 📋 Security Notes

⚠️ **IMPORTANT:**
- **NEVER** commit `.env.local` to Git (it's already in `.gitignore`)
- **NEVER** share your `SUPABASE_SERVICE_ROLE_KEY` with anyone
- Keep your `QR_JWT_SECRET` safe (it's used to sign QR tokens)
- If you accidentally expose these keys, regenerate them in Supabase immediately

---

## ✅ Completion Checklist

- [ ] Generated or copied `QR_JWT_SECRET` (32+ characters)
- [ ] Found `SUPABASE_SERVICE_ROLE_KEY` in Supabase dashboard
- [ ] Created/updated `.env.local` file
- [ ] Added both variables to `.env.local`
- [ ] Restarted dev server
- [ ] Made a test booking
- [ ] Saw QR code on confirmation page
- [ ] Tested QR code scan/verification (optional)

---

## 📞 Need Help?

If QR codes are still not generating:
1. **Check console errors** (F12 in browser)
2. **Check terminal logs** (look for `[QR API]` or `[QR Token]` messages)
3. **Verify both env vars** are set correctly
4. **Try restarting the dev server**

The error messages in the console will tell you exactly what's wrong!
