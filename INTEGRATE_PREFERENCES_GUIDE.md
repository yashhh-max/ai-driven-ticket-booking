# Integrate Theatre Preferences into Auto-Booking

Once theatre preferences are saving successfully, integrate them into the auto-booking fallback logic.

## Current State

The auto-booking system has:
- ✅ Core fallback logic (`lib/booking/auto-booking.ts`)
- ✅ API endpoint (`app/api/booking/auto-book/route.ts`)
- ✅ Theatre preference storage (`user_theatre_preferences` table)
- ⏳ **Missing**: Connection between preferences and booking logic

## Integration Steps

### Step 1: Load User Preferences in Auto-Book API

**File:** `app/api/booking/auto-book/route.ts`

Update the POST handler to load preferences:

```typescript
// At the start of POST handler, after auth check:

const { data: userPreferences } = await supabase
  .from('user_theatre_preferences')
  .select(`
    id,
    theatre_id,
    priority,
    theater:theaters(*)
  `)
  .eq('user_id', user.id)
  .order('priority', { ascending: true })

// Map to array of theatre IDs in priority order
const preferredTheatreIds = userPreferences?.map(p => p.theatre_id) || []

console.log('User preferred theatres:', preferredTheatreIds)
```

### Step 2: Update Auto-Booking Parameters

**File:** `app/api/booking/auto-book/route.ts`

Pass preferences to the auto-booking function:

```typescript
// OLD:
const result = await autoBookWithFallback(
  userId,
  movieId,
  showDate,
  numSeats,
  supabase
)

// NEW - with preferences:
const result = await autoBookWithFallback(
  userId,
  movieId,
  showDate,
  numSeats,
  supabase,
  preferredTheatreIds // Pass user's theatre priority list
)
```

### Step 3: Update Auto-Booking Core Logic

**File:** `lib/booking/auto-booking.ts`

Modify function signature to accept preferences:

```typescript
// OLD:
export async function autoBookWithFallback(
  userId: string,
  movieId: string,
  showDate: string,
  numSeats: number,
  supabase: SupabaseClient
): Promise<AutoBookingResult>

// NEW with preferences:
export async function autoBookWithFallback(
  userId: string,
  movieId: string,
  showDate: string,
  numSeats: number,
  supabase: SupabaseClient,
  preferredTheatreIds?: string[] // New parameter
): Promise<AutoBookingResult>
```

### Step 4: Sort Theatres by User Preferences

**File:** `lib/booking/auto-booking.ts`

In the function, before attempting bookings, sort theatres:

```typescript
// Get all available theatres for the movie/date
const { data: showtimes } = await supabase
  .from('showtimes')
  .select('theater_id')
  .eq('movie_id', movieId)
  .eq('show_date', showDate)
  .distinct()

let theatreIds = showtimes?.map(s => s.theater_id) || []

// SORT BY USER PREFERENCES if provided
if (preferredTheatreIds && preferredTheatreIds.length > 0) {
  theatreIds = theatreIds.sort((a, b) => {
    const aIndex = preferredTheatreIds.indexOf(a)
    const bIndex = preferredTheatreIds.indexOf(b)
    
    // If in preferences, use preference order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    
    // If only a is in preferences, prioritize it
    if (aIndex !== -1) return -1
    
    // If only b is in preferences, prioritize it
    if (bIndex !== -1) return 1
    
    // Otherwise keep original order
    return 0
  })
}

console.log('Trying theatres in order:', theatreIds)
```

### Step 5: Attempt Bookings in Preference Order

**File:** `lib/booking/auto-booking.ts`

The existing loop already tries theatres sequentially:

```typescript
for (const theatreId of theatreIds) {
  const result = await attemptBookingAtTheatre(...)
  
  if (result.success) {
    console.log(`✅ Booked at theatre ${theatreId} (preference: ${userPreferences.find(p => p.theatre_id === theatreId)?.priority || 'N/A'})`)
    return result
  }
  
  console.log(`❌ Failed at theatre ${theatreId}, trying next...`)
}
```

This now automatically tries preferred theatres first!

---

## Example: Complete Flow

### User Setup
- User goes to `/auto-book/preferences`
- Selects: Apollo Cinemas (1st), Inox Malls (2nd), Cinepolis (3rd)
- Saves preferences to `user_theatre_preferences` table

### Auto-Booking Flow
1. User triggers auto-booking for "Avengers" on "2024-12-25"
2. API loads user preferences: `[apollo_id, inox_id, cinepolis_id]`
3. System finds showtimes at all 3 theatres
4. **Sorts theatres**: [apollo_id, inox_id, cinepolis_id] (preference order)
5. **Attempts booking sequence**:
   - Try Apollo Cinemas → ❌ No seats available
   - Try Inox Malls → ✅ Successfully booked!
6. Returns booking confirmation

### Debug Logs
```
User preferred theatres: ['apollo_id', 'inox_id', 'cinepolis_id']
Trying theatres in order: ['apollo_id', 'inox_id', 'cinepolis_id']
❌ Failed at apollo_id: No available seats
❌ Failed at inox_id: No available seats
✅ Booked at cinepolis_id
```

---

## Testing Integration

### Test 1: Preferences Not Set

**Scenario:** User auto-books without selecting preferences

**Expected:**
- System uses default fallback list
- Tries theatres in default order (by rating, distance, or insertion order)
- Logs show no preference sorting applied

### Test 2: Preferences Set - First Choice Available

**Scenario:** User's 1st choice theatre has available seats

**Expected:**
- First attempt at 1st preference → Booking succeeds
- Response time is fast (only 1 theatre attempt)
- Logs show: "Booked at {theatre_1} (preference: 1)"

### Test 3: Preferences Set - First Choice Full

**Scenario:** User's 1st and 2nd choices booked out, 3rd has seats

**Expected:**
- Try 1st preference → No seats
- Try 2nd preference → No seats
- Try 3rd preference → Success
- Logs show fallback sequence
- Booking confirms theatre 3

### Test 4: All Preferred Theatres Full

**Scenario:** All 3 user preferences have no seats, other theatres do

**Expected:**
- Try all 3 preferred theatres → all fail
- Fall back to other available theatres
- Booking succeeds at non-preferred theatre
- Logs clearly show preference exhaustion

---

## Implementation Checklist

- [ ] Theatre preferences table created (script 017)
- [ ] RLS policies enabled (script 018)
- [ ] Preferences UI working on `/auto-book/preferences`
- [ ] Preferences saving and persisting to database
- [ ] Auto-book API loads user preferences
- [ ] Auto-book core logic accepts preference parameter
- [ ] Theatre sorting implemented in core logic
- [ ] Bookings tested in preference order
- [ ] Fallback to non-preferred theatres works
- [ ] Logging shows preference sequence
- [ ] Documentation updated with preference features

---

## Quick Reference: Code Locations

| Component | File | What It Does |
|-----------|------|-------------|
| Preferences UI | `app/auto-book/preferences/page.tsx` | Let users select & prioritize 3 theatres |
| Show Preferences | `app/auto-book/page.tsx` | Display user's saved preferences |
| Preferences Table | `scripts/017_add_theatre_preferences_table.sql` | Store user theatre preferences |
| RLS Policies | `scripts/018_setup_rls_theatre_preferences.sql` | Enable secure preference access |
| Auto-Book API | `app/api/booking/auto-book/route.ts` | Load preferences & call core logic |
| Core Logic | `lib/booking/auto-booking.ts` | Sort theatres by preference & attempt bookings |

---

## Troubleshooting Integration

### Problem: Auto-booking not respecting preferences

**Check These:**
1. User has saved preferences: `SELECT * FROM user_theatre_preferences WHERE user_id = '{user_id}'`
2. API is loading preferences: Check console logs for "User preferred theatres:" message
3. Sorting is working: Verify log shows preference order in "Trying theatres in order:"

### Problem: Booking fails even though preference theatre has seats

**Check These:**
1. Theatre ID is correct
2. Seats are actually available in database
3. Showtime exists for that date
4. No other constraints blocking booking (e.g., seat holds)

### Problem: Preferences loaded but not used

**Most Likely Cause:**
- `preferredTheatreIds` parameter not passed from API to core function
- Verify both API and function have the new parameter

---

## Next Steps

After integration is complete:

1. **Monitor bookings** to verify preference order is working
2. **Collect feedback** from users about theatre selection
3. **Optimize fallback order** based on booking success rates
4. **Add analytics** to track which preferences lead to successful bookings
5. **Expand to 5+ theatres** if users request more options

See [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) for additional features like:
- Dynamic preference adjustment based on booking success
- Favourite theatre weighting
- Machine learning-based preference recommendations
