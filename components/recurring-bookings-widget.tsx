'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface RecurringBooking {
  id: string;
  movie_id: string;
  theater_id: string;
  day_of_week: number;
  show_time: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_book: boolean;
  movies: { title: string; poster_url: string };
  theaters: { name: string };
}

const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function RecurringBookingsWidget() {
  const [recurringBookings, setRecurringBookings] = useState<RecurringBooking[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurringBookings();
  }, []);

  const fetchRecurringBookings = async () => {
    try {
      const response = await fetch('/api/recurring-bookings');
      const { data } = await response.json();
      setRecurringBookings(data || []);
    } catch (error) {
      console.error('Error fetching recurring bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/recurring-bookings?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      toast({
        title: 'Success',
        description: `Recurring booking ${!isActive ? 'enabled' : 'disabled'}`,
      });
      fetchRecurringBookings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update booking' });
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      await fetch(`/api/recurring-bookings?id=${id}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Recurring booking deleted',
      });
      fetchRecurringBookings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete booking' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading recurring bookings...</div>;
  }

  if (recurringBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔄 Recurring Bookings</CardTitle>
          <CardDescription>
            Schedule automatic bookings for your favorite movies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Create Recurring Booking</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">🔄 Recurring Bookings</h2>
        <p className="text-gray-600">
          Automatic bookings scheduled for future shows
        </p>
      </div>

      {recurringBookings.map((booking) => (
        <Card
          key={booking.id}
          className={`hover:shadow-lg transition-shadow ${
            !booking.is_active ? 'opacity-60' : ''
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={booking.movies.poster_url}
                    alt={booking.movies.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-bold text-lg">
                      {booking.movies.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.theaters.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Every {dayNames[booking.day_of_week]} at{' '}
                      {booking.show_time}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-4">
                  <div className="text-sm text-gray-700">
                    <p>
                      <strong>Valid from:</strong>{' '}
                      {new Date(booking.start_date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Until:</strong>{' '}
                      {booking.end_date
                        ? new Date(booking.end_date).toLocaleDateString()
                        : 'Ongoing'}
                    </p>
                    {booking.auto_book && (
                      <p className="text-green-600 font-semibold mt-2">
                        ⚡ Auto-book enabled
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant={booking.is_active ? 'outline' : 'default'}
                  onClick={() =>
                    handleToggleActive(booking.id, booking.is_active)
                  }
                >
                  {booking.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteRecurring(booking.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button className="w-full mt-4">
        + Create New Recurring Booking
      </Button>
    </div>
  );
}
