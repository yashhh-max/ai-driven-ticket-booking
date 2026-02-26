# Apply Migration Immediately

## The New Error 
```
Failed to create booked seats: column "price" of relation "booked_seats" does not exist
```

## The Fix Applied
The `booked_seats` table in your database does NOT have a `price` column. The migration was trying to insert a price that doesn't exist.

✅ **Fixed in:**
- `scripts/migrate-fix-prebooking-function.sql`
- `scripts/004_create_prebooking_system.sql`

Now it correctly inserts:
```sql
INSERT INTO booked_seats (booking_id, showtime_id, seat_id)
SELECT v_booking_id, v_pre_booking.showtime_id, pbs.seat_id
FROM pre_booked_seats pbs
```

## What You Need to Do NOW

### Step 1: Apply the Corrected Migration to Supabase

1. Go to: https://app.supabase.com
2. Select your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Copy the entire contents of: `scripts/migrate-fix-prebooking-function.sql`
6. Paste into the SQL editor
7. Click: **Run** button
8. Wait for ✅ **Success** message

### Step 2: Test Locally

The dev server should still be running. 

1. Go to: http://localhost:3000/auto-book
2. Find a pre-booking with released tickets
3. Click: **"Process Now"**
4. It should now:
   - Show "Processing..."
   - Confirm the booking
   - Redirect to confirmation page

## Troubleshooting

**Still getting the price error?**
- Migration wasn't applied
- Or old migration is still in database
- In Supabase SQL Editor, run:
  ```sql
  DROP FUNCTION IF EXISTS process_pre_booking(UUID);
  ```
  Then reapply the fixed migration

**Getting a different error?**
- Check the dev server output
- Look for `[trigger-prebooking]` logs
- The error message will tell you what's wrong
