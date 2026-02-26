# Auto-Booking Fallback System - Step-by-Step Walkthrough

## 📖 Complete Walkthrough with Real Examples

This document walks you through the entire auto-booking process from user selection to confirmation.

---

## 🎯 End-to-End Flow

### Step 1: User Arrives at Booking Page

```typescript
// app/checkout/page.tsx
import { CompleteAutoBookingPage } from '@/components/auto-booking-flow';
import { THEATRES } from '@/lib/data/theatres';

export default function CheckoutPage({ params }) {
  return (
    <CompleteAutoBookingPage
      availableTheatres={THEATRES}
      movieId={params.movieId}
      showTimeId={params.showTimeId}
      selectedSeats={['A1', 'A2', 'A3']}
    />
  );
}
```

**What User Sees:**
```
┌─────────────────────────────────────────┐
│  Complete Your Booking                  │
│  Select up to 3 theatres in order       │
│  We'll automatically book at your       │
│  preferred theatre.                     │
├─────────────────────────────────────────┤
│ Available Theatres:                     │
│ [ ] Premium Cinema - Downtown           │
│ [ ] Central Mall - IMAX                 │
│ [ ] Westside Theatre Complex            │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ [Confirm Booking]  [Back]          │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### Step 2: User Selects 3 Theatres in Priority Order

User selects:
1. Premium Cinema - Downtown (FIRST preference)
2. Central Mall - IMAX (SECOND preference)
3. Westside Theatre Complex (THIRD preference)

**What Happens in Code:**

```typescript
// The component manages this automatically
const {
  selectedTheatres,
  addTheatrePreference,
  performAutoBooking,
} = useAutoBookingFlow();

// User clicks on theatre:
// selectedTheatres becomes:
[
  {
    id: 'theatre-001',
    name: 'Premium Cinema - Downtown',
    apiEndpoint: 'https://api.premium-cinema.com/book',
    priority: 1,  // First selected = priority 1
  },
  {
    id: 'theatre-002',
    name: 'Central Mall - IMAX',
    apiEndpoint: 'https://api.central-mall.com/book',
    priority: 2,  // Second selected = priority 2
  },
  {
    id: 'theatre-003',
    name: 'Westside Theatre Complex',
    apiEndpoint: 'https://api.westside.com/book',
    priority: 3,  // Third selected = priority 3
  },
]
```

**What User Sees After Selection:**

```
┌─────────────────────────────────────────┐
│  Complete Your Booking                  │
├─────────────────────────────────────────┤
│ Your Preferences:                       │
│ ┌───────────────────────────────────┐  │
│ │ [1] Premium Cinema - Downtown ✕  │  │
│ └───────────────────────────────────┘  │
│ ┌───────────────────────────────────┐  │
│ │ [2] Central Mall - IMAX ✕         │  │
│ └───────────────────────────────────┘  │
│ ┌───────────────────────────────────┐  │
│ │ [3] Westside Theatre Complex ✕    │  │
│ └───────────────────────────────────┘  │
│                                         │
│ 📋 Booking Summary:                    │
│ 📽️ Movie: Avengers Endgame             │
│ 🕐 Time: 2024-02-10 19:30              │
│ 🪑 Seats: A1, A2, A3                   │
│ 🎭 Theatres: 3/3 selected              │
│    1. Premium Cinema                   │
│    2. Central Mall                     │
│    3. Westside Theatre                 │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ [Confirm Booking]  [Back]          │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### Step 3: User Clicks "Confirm Booking"

```typescript
const handleBooking = async () => {
  await performAutoBooking(movieId, showTimeId, selectedSeats);
};
```

This triggers:

```typescript
performAutoBooking = async (movieId, showTimeId, selectedSeats) => {
  // 1. Make API request
  const response = await fetch('/api/booking/auto-book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      movieId: 'mov-avengers-2024',
      showTimeId: 'show-2024-02-10-19-30',
      seats: ['A1', 'A2', 'A3'],
      theatrePreferences: selectedTheatres,
    }),
  });

  // 2. Parse response
  const result = await response.json();

  // 3. Update state
  setState(prev => ({
    ...prev,
    bookingResult: result.data,
  }));
};
```

---

### Step 4: Backend Processing

The API route processes the request:

```typescript
// app/api/booking/auto-book/route.ts - POST handler
export async function POST(request: NextRequest) {
  // 1. Validate request
  const body = await request.json();
  // validateAutoBookingRequest(body) ✓

  // 2. Extract user ID
  const userId = request.headers.get('x-user-id') || 'anonymous';

  // 3. Get theatre preferences
  const theatres = body.theatrePreferences;

  // 4. Build booking request
  const bookingRequest = {
    movieId: body.movieId,
    showTimeId: body.showTimeId,
    seats: body.seats,
    userId: userId,
  };

  // 5. Call core auto-booking function
  const result = await autoBookWithFallback(
    theatres,
    bookingRequest,
    { timeoutPerTheatreMs: 30000 }
  );

  // 6. Return result
  if (result.success) {
    return NextResponse.json({ success: true, data: result });
  } else {
    return NextResponse.json({ success: false, error: {...} });
  }
}
```

---

### Step 5: Auto-Booking Process - SCENARIO A (Success at First Theatre)

**Timeline:**

```
Time    Theatre A          System Status
────────────────────────────────────────
0s      Starting...        🔄 Attempting Theatre A
1s      API Call...        ⟳ Waiting for response
5s      ✓ Success!         ✅ BOOKING CONFIRMED

Result:
{
  success: true,
  theatreBooked: {
    id: 'theatre-001',
    name: 'Premium Cinema - Downtown',
    priority: 1
  },
  bookingId: 'BOOK-20240210-1001',
  message: 'Successfully booked at Premium Cinema - Downtown',
  failedTheatres: [],
  totalAttemptsCount: 1
}
```

**User Sees (Live Update):**

```
Processing your booking...

Booking Progress:

┌──────────────────────────────────┐
│ ✓ Premium Cinema - Downtown      │
│   (Success on first attempt)     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ○ Central Mall - IMAX            │
│   (Not needed)                   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ○ Westside Theatre Complex       │
│   (Not needed)                   │
└──────────────────────────────────┘
```

---

### Step 6A: Success Result Display

```typescript
// bookingResult.success === true

return (
  <div className="booking-result success">
    <h3>Booking Successful! ✓</h3>
    
    <p>Your tickets have been booked at Premium Cinema - Downtown</p>
    
    <div className="booking-details">
      <p><strong>Booking ID:</strong> BOOK-20240210-1001</p>
    </div>
    
    <p>Booking completed in 1 attempt(s)</p>
    
    <button onClick={onBookAnother}>
      Book Another Ticket
    </button>
  </div>
);
```

**User Sees:**

```
┌─────────────────────────────────────────┐
│  ✓ Booking Successful!                  │
├─────────────────────────────────────────┤
│ Your tickets have been booked at        │
│ Premium Cinema - Downtown!              │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Booking ID: BOOK-20240210-1001    │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Booking completed in 1 attempt          │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ [Book Another Ticket]              │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

User can now:
- ✅ See confirmation page at `/confirmation/BOOK-20240210-1001`
- ✅ Download tickets
- ✅ Add to wallet
- ✅ Share with others

---

## 📊 Alternative Scenario B: Fallback on Second Theatre

If Premium Cinema (Theatre A) had been full, here's what happens:

### Step 5B: Fallback Process

**Timeline:**

```
Time    Theatre A          Theatre B          System Status
────────────────────────────────────────────────────────────
0s      Starting...                           🔄 Attempting A
3s      ✗ House Full!                         ⏸ A Failed
3.1s                       Starting...        🔄 Attempting B
6s                         ✓ Success!         ✅ BOOKING CONFIRMED

Result:
{
  success: true,
  theatreBooked: {
    id: 'theatre-002',
    name: 'Central Mall - IMAX',
    priority: 2
  },
  bookingId: 'BOOK-20240210-1002',
  message: 'Successfully booked at Central Mall - IMAX',
  failedTheatres: [
    {
      theatre: { id: 'theatre-001', name: 'Premium Cinema' },
      error: 'House is full - no available seats'
    }
  ],
  totalAttemptsCount: 2
}
```

**User Sees (Real-Time Progress):**

```
Processing your booking...

⟳ Attempting theatres...

Booking Progress:

┌──────────────────────────────────┐
│ ✕ Premium Cinema - Downtown      │
│   House is full - no available   │
│   seats                          │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ✓ Central Mall - IMAX            │
│   (Booking confirmed!)           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ○ Westside Theatre Complex       │
│   (Not needed)                   │
└──────────────────────────────────┘
```

**Final Success:**

```
✓ Booking Successful!

Your tickets have been booked at Central Mall - IMAX

Booking ID: BOOK-20240210-1002

Note: First choice (Premium Cinema) was full, so we booked
at your second preference instead.

Booking completed in 2 attempts
```

---

## 📊 Worst Case Scenario C: All Theatres Fail

If all three theatres fail:

### Failure Timeline

```
Time    Theatre A          Theatre B          Theatre C        Status
──────────────────────────────────────────────────────────────────────
0s      Starting...                                            🔄 A
5s      ✗ House Full!      Starting...                         🔄 B
10s                        ✗ API Error!       Starting...      🔄 C
15s                                          ✗ Timeout!       ❌ FAILED

Result:
{
  success: false,
  message: 'Booking failed at all 3 theatres',
  failedTheatres: [
    {
      theatre: { id: 'theatre-001', name: 'Premium Cinema' },
      error: 'House is full - no available seats'
    },
    {
      theatre: { id: 'theatre-002', name: 'Central Mall' },
      error: 'API Error: Server returned 500'
    },
    {
      theatre: { id: 'theatre-003', name: 'Westside' },
      error: 'Request timeout after 30 seconds'
    }
  ],
  totalAttemptsCount: 3
}
```

**User Sees:**

```
┌─────────────────────────────────────────┐
│  ✕ Booking Failed                       │
├─────────────────────────────────────────┤
│ We were unable to complete your         │
│ booking at any of your preferred        │
│ theatres.                               │
│                                         │
│ Failed Theatres:                        │
│ ├─ Premium Cinema - Downtown            │
│ │  House is full - no available seats   │
│ │                                       │
│ ├─ Central Mall - IMAX                  │
│ │  API Error: Server returned 500       │
│ │                                       │
│ └─ Westside Theatre Complex             │
│    Request timeout after 30 seconds     │
│                                         │
│ 💡 Suggestions:                         │
│ • Try selecting different seats         │
│ • Choose a different showtime           │
│ • Update your theatre preferences       │
│ • Contact support if the issue persists │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ [Try Again]  [Contact Support]     │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

User can:
- 🔄 Try again with the same seats
- 📍 Change theatre preferences
- 🪑 Select different seats
- ☎️ Contact support

---

## 🎯 Code Flow Visualization

### Function Call Chain

```
User Clicks "Confirm Booking"
            ↓
performAutoBooking()
            ↓
fetch('/api/booking/auto-book', { POST })
            ↓
[Backend] handleAutoBookRequest()
            ↓
getUserTheatrePreferences() [if needed]
            ↓
autoBookWithFallback(theatres, bookingRequest)
            ├─→ Theatre A: attemptBookingAtTheatre()
            │   ├─→ fetch(theatre.apiEndpoint)  [5s]
            │   └─→ Failed ✗
            ├─→ Theatre B: attemptBookingAtTheatre()
            │   ├─→ fetch(theatre.apiEndpoint)  [5s]
            │   └─→ Success ✓ → Return
            └─→ Return AutoBookingResult
            ↓
[Frontend] setState({ bookingResult })
            ↓
Display Success/Failure UI
            ↓
User Sees Confirmation
```

---

## 💻 Real Code Example: Complete Transaction

### Backend Code Execution

```typescript
// 1. REQUEST ARRIVES
POST /api/booking/auto-book
{
  movieId: "mov-avengers-2024",
  showTimeId: "show-2024-02-10-19-30",
  seats: ["A1", "A2", "A3"],
  theatrePreferences: [
    { id: '1', name: 'Premium Cinema', apiEndpoint: '...', priority: 1 },
    { id: '2', name: 'Central Mall', apiEndpoint: '...', priority: 2 },
    { id: '3', name: 'Westside', apiEndpoint: '...', priority: 3 }
  ]
}

// 2. VALIDATION
✓ movieId: valid string
✓ showTimeId: valid string
✓ seats: non-empty array
✓ theatrePreferences: valid Theatre[]

// 3. USER EXTRACTION
userId = "user-12345" (from auth session)

// 4. BUILD BOOKING REQUEST
bookingRequest = {
  movieId: "mov-avengers-2024",
  showTimeId: "show-2024-02-10-19-30",
  seats: ["A1", "A2", "A3"],
  userId: "user-12345",
  bookingType: "standard"
}

// 5. AUTO-BOOKING EXECUTION
autoBookWithFallback(theatres, bookingRequest)

// 6. ATTEMPT LOGIC
for (const theatre of sortedTheatres) {
  
  // Theatre A (priority 1)
  POST https://api.premium-cinema.com/book
  {
    movieId: "mov-avengers-2024",
    ... (all booking details)
  }
  RESPONSE: { success: true, bookingId: "BOOK-20240210-1001" }
  
  // Success! Return immediately
  return {
    success: true,
    theatreBooked: Theatre A,
    bookingId: "BOOK-20240210-1001",
    failedTheatres: [],
    totalAttemptsCount: 1
  }
}

// 7. RESPONSE SENT TO FRONTEND
{ 
  success: true, 
  data: { 
    bookingId: "BOOK-20240210-1001",
    theatreBooked: { ... }
  }
}

// 8. FRONTEND STATE UPDATE
bookingResult = { success: true, ... }

// 9. UI RENDERS SUCCESS SCREEN
```

---

## 🔑 Key Points to Remember

1. **Priority Matters:** Theatre A (priority 1) is always tried first
2. **Sequential, Not Parallel:** Only one theatre attempted at a time
3. **Stops on Success:** Returns immediately when a theatre succeeds
4. **Complete History:** Tracks all failures for debugging
5. **User Feedback:** Shows which theatre succeeded (or which failed)
6. **Scalable:** Works with 3 theatres or 30 theatres with zero code changes

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] User can select up to 3 theatres
- [ ] Theatres appear in priority order
- [ ] "Confirm Booking" button works
- [ ] API endpoint responds correctly
- [ ] Success returns booking ID
- [ ] Failure shows all theatre attempts
- [ ] Progress indicator updates in real-time
- [ ] User can book multiple times in session
- [ ] Error handling works for network failures

---

## 📞 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No theatres available | `theatrePreferences` is empty | Ensure user selects theatres |
| Always fails at first theatre | API endpoint wrong | Check `apiEndpoint` config |
| Takes >30s per theatre | API is slow | Increase `timeoutPerTheatreMs` |
| Multiple bookings created | Using parallel mode | Use sequential (default) |
| No error details | Error handling issue | Check browser console |

---

## Next Steps

1. Copy code into your project
2. Configure real theatre API endpoints
3. Test with mock theatres
4. Integrate UI component
5. Test with real APIs
6. Deploy to production

You're all set! 🚀
