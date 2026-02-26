'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface PartialBooking {
  id: string;
  showtime_id: string;
  selected_seat_ids: string[];
  total_amount: number;
  created_at: string;
  expires_at: string;
  showtimes: {
    show_date: string;
    show_time: string;
    movies: { title: string; poster_url: string };
    theaters: { name: string; location: string };
  };
}

export default function PartialBookingsWidget() {
  const [partialBookings, setPartialBookings] = useState<PartialBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartialBookings();
  }, []);

  const fetchPartialBookings = async () => {
    try {
      const response = await fetch('/api/partial-bookings');
      const { data } = await response.json();
      setPartialBookings(data || []);
    } catch (error) {
      console.error('Error fetching partial bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueBooking = (bookingId: string) => {
    // Navigate to checkout page
    window.location.href = `/checkout/${bookingId}`;
  };

  const handleDeleteDraft = async (bookingId: string) => {
    try {
      await fetch(`/api/partial-bookings?id=${bookingId}`, {
        method: 'DELETE',
      });
      toast({ title: 'Success', description: 'Draft deleted' });
      fetchPartialBookings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete draft' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading saved bookings...</div>;
  }

  if (partialBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Bookings</CardTitle>
          <CardDescription>No saved draft bookings yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">📋 Saved Bookings</h2>
        <p className="text-gray-600">
          Complete your bookings before they expire
        </p>
      </div>

      {partialBookings.map((booking) => {
        const expiresAt = new Date(booking.expires_at);
        const isExpiring = expiresAt.getTime() - Date.now() < 3600000; // < 1 hour

        return (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={booking.showtimes.movies.poster_url}
                      alt={booking.showtimes.movies.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-bold text-lg">
                        {booking.showtimes.movies.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.showtimes.theaters.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          booking.showtimes.show_date
                        ).toLocaleDateString()}{' '}
                        at {booking.showtimes.show_time}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Seats: {booking.selected_seat_ids.join(', ')}</span>
                      <span className="font-bold">₹{booking.total_amount}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {isExpiring ? (
                        <span className="text-red-600 font-semibold">
                          ⏰ Expires in{' '}
                          {Math.round(
                            (expiresAt.getTime() - Date.now()) / 60000
                          )}{' '}
                          minutes
                        </span>
                      ) : (
                        <span>
                          Expires:{' '}
                          {expiresAt.toLocaleDateString() +
                            ' ' +
                            expiresAt.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleContinueBooking(booking.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteDraft(booking.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
