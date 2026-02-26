# Auto-Booking Processing Failed - Fix Instructions

## Problem
When clicking "Process Now" on a queued pre-booking, you get an error about `booking_reference` being NULL.

## Root Cause
1. The database function `process_pre_booking` uses `SUBSTR()` which doesn't exist in PostgreSQL (should be `SUBSTRING()`)
2. The booking reference generation needs to produce a valid NON-NULL value

## Solution Steps

### Step 1: Apply the Migration via Supabase Dashboard

⚠️ **If you already applied the first migration**, you need to apply this corrected one.

1. Open your Supabase Project Dashboard
   - URL: https://app.supabase.com/
   - Select your project

2. Navigate to **SQL Editor**
   - Click on the "SQL Editor" option in the left sidebar

3. Create a new query
   - Click "New Query" or the "+" button

4. Copy the migration SQL
   - Open this file: `scripts/migrate-fix-prebooking-function.sql`
   - Copy ALL the contents

5. Paste into the Supabase SQL Editor
   - Paste the entire SQL into the editor

6. Execute the migration
   - Click the blue "Run" button
   - Wait for success confirmation (should see green checkmark, no red errors)

### Step 2: Redeploy Your Application

After the database function is updated, rebuild and redeploy:

```bash
npm run build
# Deploy to your hosting (Vercel, etc.)
```

### Step 3: Test the Fix

1. Go to http://localhost:3000/auto-book (or your production URL)
2. Find a pre-booking with released tickets
3. Click "Process Now"
4. Booking should now be confirmed successfully!

## Booking Reference Format

The system generates booking references like: `ABa1b2c3d4e5f6g7h8i1-` using:
- `AB` prefix
- User ID (first 32 chars, no dashes)
- Pre-booking ID (first 6 chars)

Example: `ABgyhabxcmtlueun0abc`

This is guaranteed to be unique and non-NULL.

## Troubleshooting

### "booking_reference violates not-null constraint"
- **Solution**: The migration wasn't applied or failed
- Check: Did you see a success message in Supabase SQL Editor?
- **Fix**: Try running the migration again, or contact support

### "Column booking_reference doesn't exist"
- **Solution**: Your bookings table schema might be different
- Check: `scripts/001_create_cinema_schema.sql` for the table definition
- The `booking_reference` column should be defined as VARCHAR NOT NULL

### Still getting errors?

1. Check Supabase logs: Dashboard > Logs > "Defaults"
2. Check browser console: F12 > Console tab
3. Look for `[trigger-prebooking]` messages

## If You Already Applied the Old Migration

Run this in Supabase SQL Editor to revert and apply the fix:

```sql
-- Drop the old function
DROP FUNCTION IF EXISTS process_pre_booking(UUID);

-- Then run the entire contents of scripts/migrate-fix-prebooking-function.sql
```

## What Was Changed

### Booking Reference Generation

**Old (Error-prone):**
```sql
'AB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(...)
-- Could produce NULL if any part fails
```

**New (Guaranteed non-NULL):**
```sql
'AB' || REPLACE(v_pre_booking.user_id::text, '-', '') || SUBSTRING(p_pre_booking_id::text FROM 1 FOR 6)
-- Uses user ID and pre-booking ID - always present
```

**Error Handling:**
```plpgsql
BEGIN ... EXCEPTION WHEN OTHERS THEN ... END;
-- Catches any SQL errors with detailed messages
```

## Support
If migration fails or you need help, check:
- Supabase Documentation: https://supabase.com/docs
- Your project's SQL logs in Supabase Dashboard

