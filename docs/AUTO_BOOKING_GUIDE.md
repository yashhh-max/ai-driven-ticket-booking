# Auto-Booking Fallback System - Complete Implementation Guide

## 📋 Overview

This is a production-ready auto-booking fallback system for your movie ticket booking application. When a user selects 3 preferred theatres, the system automatically attempts to book at each theatre in priority order until one succeeds or all fail.

**Key Features:**
- ✅ Clean, modular TypeScript code
- ✅ Proper async/await handling
- ✅ Timeout handling for API calls
- ✅ Status-based validation
- ✅ Comprehensive error handling
- ✅ Scalable for unlimited theatres
- ✅ Returns which theatre was successfully booked
- ✅ Detailed failure information

---

## 📁 File Structure

```
lib/
├── booking/
│   ├── auto-booking.ts              # Core auto-booking logic
│   ├── auto-booking-examples.ts     # Usage examples & tests
│   └── auto-booking.test.ts         # Test scenarios
app/
├── api/
│   ├── booking/
│   │   └── auto-book/
│   │       └── route.ts             # Next.js API endpoint
```

---

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import {
  autoBookWithFallback,
  Theatre,
  BookingRequest,
} from '@/lib/booking/auto-booking';

// Define theatres in priority order
const theatres: Theatre[] = [
  {
    id: 'theatre-001',
    name: 'Theatre A - Premium Cinema',
    apiEndpoint: 'https://api.theatre-a.com/v1/bookings',
    priority: 1,  // Try this first
  },
  {
    id: 'theatre-002',
    name: 'Theatre B - Central Mall',
    apiEndpoint: 'https://api.theatre-b.com/v1/bookings',
    priority: 2,  // Try this second
  },
  {
    id: 'theatre-003',
    name: 'Theatre C - Downtown',
    apiEndpoint: 'https://api.theatre-c.com/v1/bookings',
    priority: 3,  // Try this last
  },
];

// Create a booking request
const bookingRequest: BookingRequest = {
  movieId: 'mov-avengers-2024',
  showTimeId: 'show-2024-02-10-19-30',
  seats: ['A1', 'A2', 'A3'],
  userId: 'user-12345',
};

// Attempt booking with automatic fallback
const result = await autoBookWithFallback(theatres, bookingRequest);

// Handle result
if (result.success) {
  console.log(`✅ Booked at ${result.theatreBooked?.name}`);
  console.log(`Booking ID: ${result.bookingId}`);
} else {
  console.log(`❌ Failed at all theatres`);
  result.failedTheatres.forEach(({ theatre, error }) => {
    console.log(`  - ${theatre.name}: ${error}`);
  });
}
```

### 2. Using the API Endpoint

**Endpoint:** `POST /api/booking/auto-book`

```bash
curl -X POST http://localhost:3000/api/booking/auto-book \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-12345" \
  -d '{
    "movieId": "mov-avengers-2024",
    "showTimeId": "show-2024-02-10-19-30",
    "seats": ["A1", "A2", "A3"]
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "bookingId": "book-xyz123",
    "theatreBooked": {
      "id": "theatre-001",
      "name": "Theatre A - Premium Cinema",
      "priority": 1
    },
    "totalAttemptsCount": 1
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": {
    "message": "Booking failed at all 3 theatres",
    "failedTheatres": [
      {
        "theatreName": "Theatre A",
        "theatreId": "theatre-001",
        "error": "House is full"
      },
      {
        "theatreName": "Theatre B",
        "theatreId": "theatre-002",
        "error": "Selected seats unavailable"
      },
      {
        "theatreName": "Theatre C",
        "theatreId": "theatre-003",
        "error": "API timeout"
      }
    ]
  }
}
```

---

## 🔧 Configuration

### Theatre Configuration

```typescript
interface Theatre {
  id: string;                    // Unique theatre identifier
  name: string;                  // Display name
  apiEndpoint: string;           // Theatre's booking API endpoint
  priority: number;              // 1 = highest (try first)
}
```

### Booking Request

```typescript
interface BookingRequest {
  movieId: string;               // Movie identifier
  showTimeId: string;            // Specific showtime
  seats: string[];               // Array of seat IDs
  userId: string;                // User making the booking
  bookingType?: 'standard' | 'premium';
}
```

### Auto-Booking Options

```typescript
interface AutoBookingOptions {
  timeoutPerTheatreMs?: number;  // Default: 30000 (30 seconds)
  stopOnFirstSuccess?: boolean;  // Default: true
}
```

---

## 📊 How It Works

### Sequential Fallback Flow

```
User selects 3 preferred theatres: A (priority 1) → B (priority 2) → C (priority 3)

┌─────────────────────────────────────────────────────────┐
│ Attempt Booking at Theatre A                            │
└─────────────────────────────────────────────────────────┘
           │
           ├─ Success? ───→ ✅ Return (Booked at A)
           │
           └─ Failure ──→ Continue to Theatre B
                         │
                         ┌─────────────────────────────┐
                         │ Attempt Booking at Theatre B│
                         └─────────────────────────────┘
                                    │
                                    ├─ Success? ───→ ✅ Return (Booked at B)
                                    │
                                    └─ Failure ──→ Continue to Theatre C
                                                   │
                                                   ┌───────────────────────────┐
                                                   │ Attempt Booking at Theatre C
                                                   └───────────────────────────┘
                                                             │
                                                             ├─ Success? ───→ ✅ Return (Booked at C)
                                                             │
                                                             └─ Failure ──→ ❌ Return (All Failed)
```

### Key Characteristics

- **Sequential Execution:** One theatre at a time to avoid multiple charges
- **Priority-Based:** Always tries highest priority (lowest number) first
- **Stops on Success:** Returns immediately after first successful booking
- **Complete Failure Info:** Returns all failures if all theatres fail
- **Timeout Protection:** Each API call has a 30-second timeout
- **Error Propagation:** Tracks and returns error details for debugging

---

## 🎯 Return Types

### AutoBookingResult

```typescript
interface AutoBookingResult {
  success: boolean;                 // Was booking successful?
  theatreBooked?: Theatre;          // Which theatre succeeded (if success)
  bookingId?: string;               // Booking confirmation ID
  message: string;                  // Human-readable message
  failedTheatres: Array<{           // All failed theatres
    theatre: Theatre;
    error: string;                  // Error reason
  }>;
  totalAttemptsCount: number;       // How many theatres were tried
}
```

---

## 💻 Code Examples

### Example 1: React Hook Usage

```typescript
import { useCallback, useState } from 'react';
import {
  autoBookWithFallback,
  Theatre,
  AutoBookingResult,
} from '@/lib/booking/auto-booking';

export function useAutoBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookWithFallback = useCallback(
    async (
      theatres: Theatre[],
      movieId: string,
      showTimeId: string,
      seats: string[]
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await autoBookWithFallback(
          theatres,
          {
            movieId,
            showTimeId,
            seats,
            userId: 'current-user', // Get from auth context
          },
          { timeoutPerTheatreMs: 30000 }
        );

        if (!result.success) {
          setError(result.message);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return {
          success: false,
          message,
          failedTheatres: [],
          totalAttemptsCount: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { bookWithFallback, loading, error };
}
```

### Example 2: Custom Theatre Selection UI

```typescript
export function TheatrePreferenceSelector() {
  const [selectedTheatres, setSelectedTheatres] = useState<Theatre[]>([]);

  const handleTheatreSelect = (theatre: Theatre) => {
    // Add theatre and maintain 3-theatre limit
    const updated = [...selectedTheatres, theatre];
    if (updated.length > 3) {
      updated.shift(); // Remove oldest
    }
    // Sort by selected order to set priority
    setSelectedTheatres(
      updated.map((t, idx) => ({ ...t, priority: idx + 1 }))
    );
  };

  return (
    <div>
      <h3>Select Your Preferred Theatres (in order)</h3>
      {selectedTheatres.map((theatre, idx) => (
        <div key={theatre.id}>
          {idx + 1}. {theatre.name} (Priority {theatre.priority})
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Error Handling with User Feedback

```typescript
export function handleBookingFailure(result: AutoBookingResult) {
  if (result.success) {
    return {
      title: 'Booking Successful!',
      message: `Your tickets are booked at ${result.theatreBooked?.name}`,
      type: 'success',
    };
  }

  // Categorize failures
  const hasSeatErrors = result.failedTheatres.some(({ error }) =>
    error.includes('SEATS')
  );
  const hasNetworkErrors = result.failedTheatres.some(({ error }) =>
    error.includes('NETWORK')
  );

  if (hasSeatErrors) {
    return {
      title: 'No Seats Available',
      message: 'Try different seats or a different showtime',
      suggestions: ['Select different seats', 'Try another showtime'],
      type: 'error',
    };
  }

  if (hasNetworkErrors) {
    return {
      title: 'Technical Issue',
      message: 'We are having temporary technical issues. Please try again.',
      suggestions: ['Try again in a moment'],
      type: 'warning',
    };
  }

  return {
    title: 'Booking Failed',
    message: 'Unfortunately, your booking could not be completed.',
    suggestions: [
      'Update your theatre preferences',
      'Try a different showtime',
      'Contact support if the issue persists',
    ],
    type: 'error',
  };
}
```

---

## 📈 Scaling for More Theatres

The system is designed to scale from 3 to unlimited theatres with **zero code changes**:

```typescript
// 3 theatres
const theatres = [{ priority: 1 }, { priority: 2 }, { priority: 3 }];

// 10 theatres - system automatically tries all in order
const scaledTheatres = Array.from({ length: 10 }, (_, i) => ({
  priority: i + 1,
  // ... other props
}));

// Use the exact same function - it works for any number
const result = await autoBookWithFallback(scaledTheatres, bookingRequest);
```

---

## ⚠️ Error Handling

### Common Error Types

| Error | Cause | Action |
|-------|-------|--------|
| `HOUSE_FULL` | All seats booked | Try another showtime |
| `SEATS_UNAVAILABLE` | Selected seats taken | Choose different seats |
| `API_ERROR` | Theatre server error | Try again |
| `NETWORK_ERROR` | Connection failed | Check internet, retry |
| `TIMEOUT` | API took >30s | Retry |
| `INVALID_REQUEST` | Bad booking data | Verify seats/showtime |

### Timeout Handling

```typescript
// The system automatically handles timeouts
const result = await autoBookWithFallback(theatres, bookingRequest, {
  timeoutPerTheatreMs: 30000, // 30 seconds per theatre
});

// If Theatre A times out, automatically tries Theatre B
// Total timeout protection: 90 seconds for 3 theatres
```

---

## 🔐 Security Considerations

1. **User Validation:** Always validate `userId` from auth context, not user input
2. **Rate Limiting:** Implement rate limiting on `/api/booking/auto-book`
3. **Theatre Validation:** Validate theatre endpoints at configuration time
4. **Booking Verification:** Verify bookings in database after response
5. **API Keys:** Store theatre API credentials securely in environment variables

```typescript
// ✅ Good: Get userId from auth context
const userId = session.user.id;

// ❌ Bad: Users can spoof IDs
const userId = req.headers.get('x-user-id');
```

---

## 🧪 Testing

### Running Test Scenarios

```bash
# Run in Node.js
node -e "import('./lib/booking/auto-booking.test.ts').then(m => m.runAllTestScenarios())"
```

### Test Coverage

- ✅ Success at first theatre
- ✅ Fallback to second theatre
- ✅ Fallback to third theatre
- ✅ All theatres fail
- ✅ Timeout handling
- ✅ Scaling with 5+ theatres
- ✅ Error categorization

---

## 📊 Performance Metrics

### Sequential Approach (Recommended)
- **Average Time:** ~5-35 seconds (depends on theatre response times)
- **API Calls:** 1-3 (stops at first success)
- **Cost:** Only successful booking charged
- **Best For:** Production use

### Parallel Approach (Alternative)
- **Average Time:** ~5-10 seconds (all calls simultaneous)
- **API Calls:** All theatres called at once
- **Cost:** Multiple charges possible
- **Best For:** High-speed requirement with payment cancellation

```typescript
// Use parallel only if needed
const result = await autoBookWithRace(theatres, bookingRequest);
```

---

## 🔄 Integration Checklist

- [ ] Copy `auto-booking.ts` to `lib/booking/`
- [ ] Create API route at `app/api/booking/auto-book/route.ts`
- [ ] Update your theatre database with API endpoints
- [ ] Add user theatre preference storage
- [ ] Implement theatre selection UI
- [ ] Add error handling in booking flow
- [ ] Test with mock theatres
- [ ] Deploy to staging
- [ ] Load test with real theatre APIs
- [ ] Deploy to production

---

## 🎓 Key Learnings

### Why Sequential Over Parallel?

```
Sequential (Safe):
├─ Theatre A fails (5s)
├─ Theatre B fails (5s)
└─ Theatre C succeeds (5s)
   └─ User charged once ✅

Parallel (Risky):
├─ Theatre A fails → Cancel booking
├─ Theatre B succeeds → User charged ✅
└─ Theatre C succeeds → User charged AGAIN ❌❌
```

### Design Patterns Used

1. **Modular Functions:** Each operation is independent
2. **Async/Await:** Modern promise handling
3. **Error Objects:** Structured error information
4. **Early Exit:** Stop as soon as success found
5. **Failure Tracking:** Complete history of failures

---

## 📞 Support & Debugging

### Enable Detailed Logging

```typescript
// Add logging to track fallback process
const result = await autoBookWithFallback(theatres, bookingRequest);

console.log(`[AutoBook] Success: ${result.success}`);
console.log(`[AutoBook] Attempts: ${result.totalAttemptsCount}`);
console.log(`[AutoBook] Theatre: ${result.theatreBooked?.name}`);
result.failedTheatres.forEach(({ theatre, error }) => {
  console.log(`[AutoBook] ${theatre.name} failed: ${error}`);
});
```

### Common Issues

**Q: Booking takes too long**
A: Increase `timeoutPerTheatreMs` or add Theatre prioritization logic

**Q: Multiple bookings created**
A: Use sequential approach (default) instead of parallel

**Q: Theatre APIs not responding**
A: Implement circuit breaker pattern or skip unreliable theatres

---

## 📝 License & Attribution

This implementation is part of your AI-Driven Ticket Booking System.
