# Fix: Seats Not Showing in Some Movies

## The Problem

When clicking on a movie showtime to book tickets, the seat selector shows no seats for some movies/theatres. The page appears to load correctly but the seat grid is empty.

## Root Cause

Some theatres in your database don't have any seats created. The seat selector component queries for seats by `theater_id`, and if no seats exist, it shows an empty grid.

## The Solution (3 Steps)

### Step 1: Diagnose Which Theatres Are Missing Seats

**In Supabase SQL Editor:**

1. Click **New Query**
2. Copy entire contents of: `scripts/diagnose_missing_seats.sql`
3. Paste into SQL Editor
4. Click **Run**

**Expected Output:**

You'll see a table showing each theatre and how many seats it has. Look for theatres with `seat_count = 0` - those are the problem ones.

Example output:
```
name             | seat_count
Apollo Cinemas   | 120
Inox Malls       | 0           ← This one needs seats!
Cinepolis        | 120
```

### Step 2: Create Seats for Missing Theatres

**In Supabase SQL Editor:**

1. Click **New Query**
2. Copy entire contents of: `scripts/create_missing_seats.sql`
3. Paste into SQL Editor
4. Click **Run**

**What This Does:**
- Creates a standard 10-row x 12-seat layout for any theatre missing seats
- Automatically assigns seat types:
  - Rows 1-2, seats 4-9: VIP (premium pricing)
  - Rows 3-8, seats 3-10: Premium (25% higher price)
  - All others: Standard (base price)
- Verifies all theatres now have seats

**Expected Output:**

Should show a summary like:
```
name             | total_seats | rows
Apollo Cinemas   | 120         | 10
Inox Malls       | 120         | 10
Cinepolis        | 120         | 10
```

All theatres should now have the same number of seats.

### Step 3: Test in Your App

1. Go to your movie listing page
2. Click on a movie from the previously empty theatre
3. Click **"Select Tickets"** or the booking button
4. Should now see the full seat grid with rows A-J and seat numbers

**Verify success:** 
- ✅ Seat grid displays
- ✅ Can click seats to select them
- ✅ Seat types show different colors (VIP, Premium, Standard)
- ✅ Booking works end-to-end

---

## Script Contents Explained

### diagnose_missing_seats.sql

Runs 4 diagnostic queries:

1. **All theatres with seat counts**
   - Shows which theatres have 0 seats
   - Shows which have a full complement

2. **Theatres with ZERO seats**
   - Lists only the ones that need fixing
   - Used by the fix script

3. **Seat distribution by row**
   - Shows how many seats in each row per theatre
   - Helpful for understanding existing layouts

4. **Detailed seat statistics**
   - Shows total seats, rows, and seat number ranges
   - Confirms all theatres match expected layout

### create_missing_seats.sql

1. **Identifies theatres without seats**
   - Uses a LEFT JOIN to find theatres with 0 seats

2. **Creates standard seat layout**
   - Generates 10 rows (A-J) × 12 seats each
   - Uses `generate_series()` for efficient SQL generation
   - Assigns ~120 seats per theatre

3. **Assigns seat types**
   - VIP: Premium locations (rows 1-2, center seats)
   - Premium: Popular sections (rows 3-8, center seats)  
   - Standard: Regular seats (everything else)

4. **Verifies completion**
   - Shows final seat counts to confirm
   - Uses `ON CONFLICT ... DO NOTHING` to prevent duplicates

---

## Seat Layout Details

Standard layout created:
```
       1 2 3 4 5 6 7 8 9 10 11 12
    A:    S S V V V V V V S  S  S
    B:    S S V V V V V V S  S  S
    C:    S P P P P P P P P  S  S
    D:    S P P P P P P P P  S  S
    E:    S P P P P P P P P  S  S
    F:    S P P P P P P P P  S  S
    G:    S P P P P P P P P  S  S
    H:    S P P P P P P P P  S  S
    I:    S S S S S S S S S  S  S
    J:    S S S S S S S S S  S  S

Legend:
V = VIP (1.5x price)
P = Premium (1.25x price)
S = Standard (base price)
```

Each theatre gets 10 rows × 12 seats = 120 seats total

---

## After Fixing

### What Changes:
- ✅ All theatres now have seats in the database
- ✅ Movie pages show seat grids for all showtimes
- ✅ Users can book tickets from any theatre
- ✅ Seat types and pricing work correctly

### Performance Impact:
- Minimal - just adds ~120 seats per theatre to database
- Queries are indexed on `theater_id` for fast lookups
- Real-time seat status updates continue working

---

## Troubleshooting

### "Still no seats showing after fix"

**Check these:**

1. **Verify seats were created:**
   ```sql
   SELECT COUNT(*) FROM seats;
   ```
   Should show increased count (e.g., 240+)

2. **Verify specific theatre has seats:**
   ```sql
   SELECT COUNT(*) FROM seats 
   WHERE theater_id = '{theatre_id_here}';
   ```
   Should return 120

3. **Check browser console for errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try loading a movie page
   - Look for fetch errors or SQL errors

4. **Clear app cache:**
   - Hard refresh page (Ctrl+Shift+R)
   - Or clear browser cache
   - Or restart your Next.js dev server

### "Some theatres still have 0 seats"

**This means:**
- The `create_missing_seats.sql` script may not have run successfully
- There might be a database constraint preventing inserts
- The theatre might have been added after the script ran

**Solution:**
1. Run diagnostic script again to see current state
2. If a theatre still shows 0 seats:
   ```sql
   -- Manually add seats for that specific theatre
   INSERT INTO seats (theater_id, row_label, seat_number, seat_type)
   VALUES 
     ('{theatre_id}', 'A', 1, 'standard'),
     ('{theatre_id}', 'A', 2, 'standard'),
     -- ... repeat for all 120 seats
   ```
3. Or contact support with the theatre name

---

## How Seats Are Used in Booking

When a user books tickets:

1. **Load showtime** → Gets theatre_id from showtime record
2. **Fetch seats** → Queries `WHERE theater_id = {theatre_id}`
3. **Check status** → Marks seats as booked/locked/available
4. **Display grid** → Shows interactive seat selections
5. **Lock seats** → Reserves selected seats temporarily
6. **Complete booking** → Creates booking with selected seat IDs

If step 2 returns 0 rows, users see an empty grid (your current issue).

---

## Prevention for Future

When adding new theatres:

**Immediately after creating a theatre record, run:**

```sql
-- Add seats for newly created theatre
INSERT INTO seats (theater_id, row_label, seat_number, seat_type)
SELECT 
  '{new_theatre_id}',
  CHR(65 + row_num - 1) as row_label,
  seat_num,
  CASE 
    WHEN row_num <= 2 AND seat_num BETWEEN 4 AND 9 THEN 'vip'
    WHEN row_num BETWEEN 3 AND 8 AND seat_num BETWEEN 3 AND 10 THEN 'premium'
    ELSE 'standard'
  END
FROM generate_series(1, 10) as row_num
CROSS JOIN generate_series(1, 12) as seat_num;
```

Or add a database trigger to auto-create seats when a theatre is added.

---

## Related Files

- [scripts/diagnose_missing_seats.sql](scripts/diagnose_missing_seats.sql) - Check which theatres have seats
- [scripts/create_missing_seats.sql](scripts/create_missing_seats.sql) - Add seats to theatres
- [components/seat-selector.tsx](components/seat-selector.tsx) - Seat selector UI component
- [app/book/[showtimeId]/page.tsx](app/book/[showtimeId]/page.tsx) - Booking page that loads seats

---

## Quick Reference

```
ISSUE:    Seats not showing for some movies
CAUSE:    Those theatres don't have seats in database
DIAGNOSIS: Run diagnose_missing_seats.sql
FIX:      Run create_missing_seats.sql
TIME:     ~2 minutes
RESULT:   All theatres have seats, booking works
```
