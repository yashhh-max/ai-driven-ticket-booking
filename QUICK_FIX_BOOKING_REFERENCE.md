# Quick Fix: booking_reference NULL Error

## What Happened
You got an error: `"null value in column \"booking_reference\" violates not-null constraint"`

This means the first migration fix had an issue with the booking reference generation logic.

## The Quick Fix (2 Steps)

### Step 1: Apply the Corrected Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the **entire contents** of:  
   `scripts/migrate-fix-prebooking-function.sql`
4. Paste it into the SQL Editor
5. Click **"Run"**
6. Wait for ✅ **Success** (green checkmark)

### Step 2: Redeploy & Test

```bash
npm run build
npm run dev
```

Then go to `/auto-book` and try clicking "Process Now" again.

---

## What Was Fixed

### Before (NULL Error):
```sql
'AB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(calculation, 6, '0')
```
❌ Complex calculation could fail and return NULL

### After (Guaranteed non-NULL):
```sql
'AB' || REPLACE(user_id::text, '-', '') || SUBSTRING(pre_booking_id::text FROM 1 FOR 6)
```
✅ Always has a value - uses user_id and pre_booking_id

### Example booking_reference:
- `ABgyhabxcmtlueun0abc`
  - `AB` = prefix
  - `gyhabxcmtlueun` = user ID (dashes removed)
  - `0abc` = first 6 chars of pre-booking ID

---

## If It Still Doesn't Work

### 1. Check if migration was applied
- In Supabase, go to SQL Editor
- Run: `SELECT COUNT(*) FROM pg_proc WHERE proname = 'process_pre_booking';`
- Should return `1`

### 2. Check Supabase logs
- Dashboard > Logs > "Defaults"
- Look for any error messages

### 3. Check browser console
- F12 > Console tab
- Look for `[trigger-prebooking]` logs
- Copy the exact error message

### 4. Verify bookings table
- Dashboard > Table Editor > "bookings"
- Check that `booking_reference` column exists
- Should be type: `character varying`, NOT NULL

---

## Need More Help?

See: `FIX_AUTO_BOOKING.md` for complete troubleshooting guide
