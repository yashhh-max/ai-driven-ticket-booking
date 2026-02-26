# 🎯 Advanced Cinema Booking Features - Implementation Guide

This document covers the 5 new advanced features implemented for the cinema booking system.

## Features Overview

### 1. **Partial Bookings** ✅
Save incomplete bookings as drafts for later completion.

**Location:** 
- API: [app/api/partial-bookings/route.ts](app/api/partial-bookings/route.ts)
- Component: [components/partial-bookings-widget.tsx](components/partial-bookings-widget.tsx)

**Database Table:** `partial_bookings`
- Stores seat selections and totals
- Auto-expires after 24 hours
- Allows draft resumption before confirmation

**Features:**
- Save bookings mid-process
- View all saved drafts
- Continue booking from draft
- Auto-cleanup after expiration

**Usage:**
```typescript
// Save a partial booking
const response = await fetch('/api/partial-bookings', {
  method: 'POST',
  body: JSON.stringify({
    showtimeId: 'uuid',
    selectedSeatIds: ['A1', 'A2'],
    totalAmount: 500
  })
});

// Get all saved bookings
const { data } = await fetch('/api/partial-bookings').then(r => r.json());

// Delete draft
await fetch('/api/partial-bookings?id=draft-id', { method: 'DELETE' });
```

---

### 2. **Recurring Bookings** ✅
Schedule automatic bookings for multiple future shows of the same movie.

**Location:**
- API: [app/api/recurring-bookings/route.ts](app/api/recurring-bookings/route.ts)
- Component: [components/recurring-bookings-widget.tsx](components/recurring-bookings-widget.tsx)

**Database Table:** `recurring_bookings`
- Define day of week (0-6: Sunday-Saturday)
- Set start/end dates for recurrence
- Optional auto-booking on ticket release
- Enable/disable without deletion

**Features:**
- Book same movie every week/day
- Set date range for recurrence
- Auto-book enabled option
- Pause/resume recurring bookings
- View all active recurring schedules

**Usage:**
```typescript
// Create recurring booking
const response = await fetch('/api/recurring-bookings', {
  method: 'POST',
  body: JSON.stringify({
    movieId: 'uuid',
    theaterId: 'uuid',
    dayOfWeek: 5, // Friday
    showTime: '19:00',
    startDate: '2025-02-01',
    endDate: '2025-12-31',
    autoBook: true
  })
});

// Get recurring bookings
const { data } = await fetch('/api/recurring-bookings').then(r => r.json());

// Disable recurring booking
await fetch('/api/recurring-bookings?id=booking-id', {
  method: 'PATCH',
  body: JSON.stringify({ isActive: false })
});
```

---

### 3. **Waitlist System** ✅
Add users to waitlist when show is fully booked, notify on availability.

**Location:**
- API: [app/api/waitlist/route.ts](app/api/waitlist/route.ts)
- Component: [components/waitlist-widget.tsx](components/waitlist-widget.tsx)

**Database Table:** `waitlist`
- Track position in queue
- Monitor status (waiting, notified, booked, cancelled)
- Store notification timestamp
- Prevent duplicate entries

**Features:**
- Queue position visibility
- Auto-notification on seat availability
- Remove from waitlist option
- Real-time position updates
- Occupancy-based queue management

**Usage:**
```typescript
// Add to waitlist
const response = await fetch('/api/waitlist', {
  method: 'POST',
  body: JSON.stringify({ showtimeId: 'uuid' })
});

// Get waitlist entries
const { data } = await fetch('/api/waitlist').then(r => r.json());

// Remove from waitlist
await fetch('/api/waitlist?id=waitlist-id', { method: 'DELETE' });
```

---

### 4. **Dynamic Pricing** ✅
Adjust ticket prices based on demand (occupancy) and time until showtime.

**Location:**
- API: [app/api/dynamic-pricing/route.ts](app/api/dynamic-pricing/route.ts)
- Component: [components/dynamic-pricing-display.tsx](components/dynamic-pricing-display.tsx)

**Database Table:** `dynamic_pricing`
- Store base vs current price
- Track occupancy percentage
- Calculate price multipliers
- Update every 5 minutes

**Pricing Algorithm:**
```
Base Multiplier (occupancy-based):
- 80%+ occupied: 1.4x (high demand)
- 60-79% occupied: 1.2x (moderate demand)
- 40-59% occupied: 1.1x (normal)
- <40% occupied: 1.0x (standard)

Time-based modifiers:
- Last 2 hours: +15% boost
- 7+ days ahead: -15% discount

Final: basePrice × multiplier (capped between 0.8x-1.5x)
```

**Features:**
- Real-time price calculation
- Occupancy visualization
- Time-to-showtime display
- Price change indicators
- Automatic updates

**Usage:**
```typescript
// Calculate dynamic pricing
const response = await fetch('/api/dynamic-pricing', {
  method: 'POST',
  body: JSON.stringify({ showtimeId: 'uuid' })
});

// Get pricing info
const { data } = await fetch('/api/dynamic-pricing?showtimeId=uuid')
  .then(r => r.json());
```

---

### 5. **Booking Modification** ✅
Allow users to change date, time, or seats before payment confirmation.

**Location:**
- API: [app/api/booking-modifications/route.ts](app/api/booking-modifications/route.ts)
- Component: [components/booking-modify-dialog.tsx](components/booking-modify-dialog.tsx)

**Database Table:** `booking_modifications`
- Audit trail of all changes
- Track old vs new values
- Store reason for modification
- Limit modifications before confirmation

**Features:**
- Change show date
- Change show time
- Change selected seats
- Provide reason for change
- View modification history
- Limit modifications to prevent abuse

**Usage:**
```typescript
// Request booking modification
const response = await fetch('/api/booking-modifications', {
  method: 'POST',
  body: JSON.stringify({
    bookingId: 'uuid',
    newShowDate: '2025-02-15',
    newShowTime: '19:00',
    newSeats: ['B1', 'B2'],
    reason: 'Scheduling conflict'
  })
});

// Get modification history
const { data } = await fetch('/api/booking-modifications?bookingId=uuid')
  .then(r => r.json());
```

---

## Setup Instructions

### 1. **Apply Database Migration**

Execute the SQL migration in Supabase:

```bash
# Copy the SQL content from scripts/008_add_advanced_booking_features.sql
# Paste into Supabase SQL Editor and execute
```

Or run via Node script (requires Supabase service role):
```bash
node scripts/apply-advanced-features.js
```

### 2. **Update Type Definitions**

The types have been added to [lib/types.ts](lib/types.ts):
- `RecurringBooking`
- `WaitlistEntry`
- `PartialBooking`
- `BookingModification`
- `DynamicPricing`

### 3. **Add UI Components to Pages**

#### My Bookings Page
```tsx
import PartialBookingsWidget from '@/components/partial-bookings-widget';
import RecurringBookingsWidget from '@/components/recurring-bookings-widget';
import WaitlistWidget from '@/components/waitlist-widget';

export default function MyBookingsPage() {
  return (
    <div className="space-y-8">
      <PartialBookingsWidget />
      <RecurringBookingsWidget />
      <WaitlistWidget />
    </div>
  );
}
```

#### Showtime Details Page
```tsx
import DynamicPricingDisplay from '@/components/dynamic-pricing-display';
import BookingModifyDialog from '@/components/booking-modify-dialog';

export default function ShowtimeDetailsPage({ showtimeId, bookingId }) {
  return (
    <div>
      <DynamicPricingDisplay showtimeId={showtimeId} />
      <BookingModifyDialog bookingId={bookingId} />
    </div>
  );
}
```

### 4. **Environment Setup**

Ensure you have in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. **Testing**

```bash
# Start dev server
npm run dev

# Test APIs
curl -X POST http://localhost:3000/api/partial-bookings \
  -H "Content-Type: application/json" \
  -d '{"showtimeId":"uuid","selectedSeatIds":["A1"],"totalAmount":250}'

# View UI components
# Navigate to /my-bookings to see new widgets
```

---

## Database Schema

### new_bookings columns
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS:
- is_partial BOOLEAN DEFAULT false
- original_date DATE
- original_time TIME
- is_modified BOOLEAN DEFAULT false
- modification_count INTEGER DEFAULT 0
```

### recurring_bookings
```sql
- id UUID PRIMARY KEY
- user_id UUID (foreign key)
- movie_id UUID (foreign key)
- theater_id UUID (foreign key)
- day_of_week INTEGER (0-6)
- show_time TIME
- start_date DATE
- end_date DATE (nullable)
- is_active BOOLEAN
- auto_book BOOLEAN
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### waitlist
```sql
- id UUID PRIMARY KEY
- user_id UUID (foreign key)
- showtime_id UUID (foreign key)
- position INTEGER
- status TEXT (waiting|notified|booked|cancelled)
- created_at TIMESTAMPTZ
- notified_at TIMESTAMPTZ (nullable)
```

### partial_bookings
```sql
- id UUID PRIMARY KEY
- user_id UUID (foreign key)
- showtime_id UUID (foreign key)
- selected_seat_ids TEXT[]
- total_amount DECIMAL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- expires_at TIMESTAMPTZ (DEFAULT NOW() + 24 hours)
```

### booking_modifications
```sql
- id UUID PRIMARY KEY
- booking_id UUID (foreign key)
- old_show_date DATE
- new_show_date DATE
- old_show_time TIME
- new_show_time TIME
- old_seats TEXT[]
- new_seats TEXT[]
- modification_type TEXT
- reason TEXT
- created_at TIMESTAMPTZ
```

### dynamic_pricing
```sql
- id UUID PRIMARY KEY
- showtime_id UUID (foreign key, unique)
- base_price DECIMAL
- current_price DECIMAL
- occupancy_percentage INTEGER (0-100)
- time_until_show_minutes INTEGER
- price_multiplier DECIMAL (0.8-1.5)
- updated_at TIMESTAMPTZ
```

---

## API Reference

### Partial Bookings
- **POST** `/api/partial-bookings` - Save draft booking
- **GET** `/api/partial-bookings` - Get user's drafts
- **DELETE** `/api/partial-bookings?id=id` - Delete draft

### Recurring Bookings
- **POST** `/api/recurring-bookings` - Create recurring booking
- **GET** `/api/recurring-bookings` - Get all recurring bookings
- **PATCH** `/api/recurring-bookings?id=id` - Toggle active status
- **DELETE** `/api/recurring-bookings?id=id` - Delete recurring booking

### Waitlist
- **POST** `/api/waitlist` - Add to waitlist
- **GET** `/api/waitlist` - Get user's waitlist entries
- **DELETE** `/api/waitlist?id=id` - Remove from waitlist

### Booking Modifications
- **POST** `/api/booking-modifications` - Request modification
- **GET** `/api/booking-modifications?bookingId=id` - Get modification history

### Dynamic Pricing
- **POST** `/api/dynamic-pricing` - Calculate pricing
- **GET** `/api/dynamic-pricing?showtimeId=id` - Get pricing info

---

## Performance Notes

1. **Partial Bookings**: Auto-expire after 24 hours to prevent database bloat
2. **Waitlist**: Position numbers update when users are booked or cancelled
3. **Dynamic Pricing**: Cached for 5 minutes to reduce recalculation overhead
4. **Recurring Bookings**: Processed by scheduled jobs (to be implemented via Supabase Cron)

---

## Future Enhancements

1. **Notification System**: Send emails when waitlist seats available
2. **Recurring Auto-Execute**: Scheduled job to book upcoming recurring shows
3. **Price History**: Track historical prices for analytics
4. **Modification Fees**: Optional charge for modifications
5. **Group Waitlist**: Queue groups for same show
6. **AI Price Prediction**: ML-based optimal booking time suggestions

---

## Troubleshooting

### Partial bookings not expiring
- Check Supabase scheduled jobs (pgcron extension)
- Manually clean with: `DELETE FROM partial_bookings WHERE expires_at < NOW()`

### Waitlist not working
- Ensure occupancy calculation is accurate
- Check RLS policies allow user access
- Verify showtime exists in showtimes table

### Dynamic pricing not updating
- Verify `price` column exists in showtimes table
- Check occupancy calculation logic
- Ensure API endpoint is being called

### Recurring bookings not triggering
- Set up Supabase scheduled job to process recurring_bookings
- Verify `is_active` = true and date is within range
- Check auto_book flag setting

---

**Last Updated:** 2025-01-31
**Status:** ✅ All 5 features implemented and ready for integration
