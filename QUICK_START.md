# 🚀 Quick Start - Advanced Features Integration

Copy-paste code snippets to quickly integrate the new features into your pages.

---

## 1️⃣ Add Partial Bookings to My Bookings Page

**File:** `app/my-bookings/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import PartialBookingsWidget from '@/components/partial-bookings-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyBookingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">My Bookings</h1>

      {/* Partial Bookings Section */}
      <section className="mb-12">
        <PartialBookingsWidget />
      </section>

      {/* Divider */}
      <div className="border-t-2 my-8"></div>

      {/* Your existing completed bookings section */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>✅ Confirmed Bookings</CardTitle>
            <CardDescription>Your upcoming and past bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Your existing booking list code */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
```

---

## 2️⃣ Add All Features Dashboard

**Create:** `app/bookings-dashboard/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import PartialBookingsWidget from '@/components/partial-bookings-widget';
import RecurringBookingsWidget from '@/components/recurring-bookings-widget';
import WaitlistWidget from '@/components/waitlist-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BookingsDashboard() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">📊 Bookings Dashboard</h1>

      <Tabs defaultValue="partial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partial">💾 Saved Drafts</TabsTrigger>
          <TabsTrigger value="recurring">🔄 Recurring</TabsTrigger>
          <TabsTrigger value="waitlist">⏳ Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="partial" className="space-y-4">
          <PartialBookingsWidget />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <RecurringBookingsWidget />
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <WaitlistWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 3️⃣ Add Dynamic Pricing to Showtime Display

**File:** `app/pre-book/[showtimeId]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DynamicPricingDisplay from '@/components/dynamic-pricing-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PreBookPage() {
  const params = useParams();
  const showtimeId = params.showtimeId as string;
  const [showtime, setShowtime] = useState(null);

  useEffect(() => {
    // Fetch showtime details
    const fetchShowtime = async () => {
      const response = await fetch(`/api/showtimes/${showtimeId}`);
      const data = await response.json();
      setShowtime(data);
    };

    fetchShowtime();
  }, [showtimeId]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Dynamic Pricing Display */}
      <div className="mb-6">
        <DynamicPricingDisplay showtimeId={showtimeId} />
      </div>

      {/* Movie Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{showtime?.movie?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{showtime?.movie?.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-semibold">
                {new Date(showtime?.show_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="text-lg font-semibold">{showtime?.show_time}</p>
            </div>
          </div>

          {/* Your existing seat selection code */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 4️⃣ Add Booking Modification Button

**File:** `app/checkout/[bookingId]/page.tsx`

```tsx
'use client';

import { useParams } from 'next/navigation';
import BookingModifyDialog from '@/components/booking-modify-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckoutPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Confirm Your Booking</h1>

      {/* Booking Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your booking details display */}

          <div className="flex gap-4 mt-6">
            <BookingModifyDialog 
              bookingId={bookingId}
              onModificationSuccess={() => {
                // Refresh booking data
                window.location.reload();
              }}
            />
            <Button className="flex-1">
              💳 Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5️⃣ Add Recurr Booking Creation Modal

**Create:** `components/create-recurring-booking-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface CreateRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieId: string;
  theaterId: string;
  showTime: string;
}

export default function CreateRecurringDialog({
  open,
  onOpenChange,
  movieId,
  theaterId,
  showTime,
}: CreateRecurringDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoBook: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/recurring-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          theaterId,
          dayOfWeek: formData.dayOfWeek,
          showTime,
          startDate: formData.startDate,
          endDate: formData.endDate,
          autoBook: formData.autoBook,
        }),
      });

      if (!response.ok) throw new Error('Failed to create recurring booking');

      toast({
        title: 'Success',
        description: 'Recurring booking created!',
      });

      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create booking' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔄 Create Recurring Booking</DialogTitle>
          <DialogDescription>
            Schedule automatic bookings for upcoming shows
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Day of Week</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dayOfWeek: parseInt(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">End Date (Optional)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoBook"
              checked={formData.autoBook}
              onChange={(e) =>
                setFormData({ ...formData, autoBook: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="autoBook" className="text-sm">
              ⚡ Enable auto-booking when tickets are released
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Recurring Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6️⃣ Add Save Draft Button to Booking Page

**In your seat selection component:**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SeatSelectorProps {
  showtimeId: string;
  onBookingComplete?: () => void;
}

export default function SeatSelector({ showtimeId, onBookingComplete }: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSaveDraft = async () => {
    if (selectedSeats.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one seat' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/partial-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId,
          selectedSeatIds: selectedSeats,
          totalAmount,
        }),
      });

      const data = await response.json();

      toast({
        title: '✅ Saved!',
        description: 'Your booking has been saved. Resume it anytime within 24 hours.',
      });

      // Clear selection
      setSelectedSeats([]);
      setTotalAmount(0);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save draft' });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one seat' });
      return;
    }

    // Your existing checkout logic
    onBookingComplete?.();
  };

  return (
    <div className="space-y-4">
      {/* Your existing seat selection UI */}

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={loading}
          className="flex-1"
        >
          💾 Save as Draft
        </Button>
        <Button
          onClick={handleProceedToCheckout}
          disabled={loading}
          className="flex-1"
        >
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
}
```

---

## 7️⃣ Add to Navigation Menu

**File:** `components/header.tsx` or `components/navbar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🎬 CinemaHub
        </Link>

        <div className="flex gap-4 items-center">
          <Link href="/movies" className="text-gray-700 hover:text-black">
            Movies
          </Link>
          <Link href="/my-bookings" className="text-gray-700 hover:text-black">
            My Bookings
          </Link>
          {/* New Dashboard Link */}
          <Link href="/bookings-dashboard" className="text-gray-700 hover:text-black">
            📊 Dashboard
          </Link>
          <Button variant="outline">Login</Button>
        </div>
      </nav>
    </header>
  );
}
```

---

## 🧪 API Usage Examples

### Save Partial Booking
```typescript
const saveBooking = async () => {
  const response = await fetch('/api/partial-bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      showtimeId: 'uuid-here',
      selectedSeatIds: ['A1', 'A2'],
      totalAmount: 500,
    }),
  });
  const data = await response.json();
  console.log('Draft saved:', data.partialBookingId);
};
```

### Get Dynamic Pricing
```typescript
const getPricing = async (showtimeId: string) => {
  const response = await fetch(`/api/dynamic-pricing?showtimeId=${showtimeId}`);
  const { data } = await response.json();
  console.log('Current price:', data.current_price);
  console.log('Occupancy:', data.occupancy_percentage);
};
```

### Add to Waitlist
```typescript
const joinWaitlist = async (showtimeId: string) => {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify({ showtimeId }),
  });
  const data = await response.json();
  console.log('Position:', data.position);
};
```

---

## ⏱️ Estimated Integration Time

- **Copy-paste components**: 5 minutes
- **Add navigation links**: 2 minutes
- **Connect APIs**: 10 minutes
- **Test all features**: 15 minutes
- **Deploy**: 5 minutes

**Total: ~35 minutes**

---

**🎉 You're all set! Start integrating now.**
