'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface WaitlistEntry {
  id: string;
  showtime_id: string;
  position: number;
  status: string;
  created_at: string;
  showtimes: {
    show_date: string;
    show_time: string;
    movies: { title: string; poster_url: string };
    theaters: { name: string };
  };
}

export default function WaitlistWidget() {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
    // Poll for status changes every 30 seconds
    const interval = setInterval(fetchWaitlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlist = async () => {
    try {
      const response = await fetch('/api/waitlist');
      const { data } = await response.json();
      setWaitlistEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWaitlist = async (waitlistId: string) => {
    try {
      await fetch(`/api/waitlist?id=${waitlistId}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Removed from waitlist',
      });
      fetchWaitlist();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove from waitlist' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading waitlist...</div>;
  }

  if (waitlistEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⏳ Waitlist</CardTitle>
          <CardDescription>You're not on any waitlists</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            When a show is full, you can join the waitlist to be notified when
            seats become available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">⏳ Waitlist</h2>
        <p className="text-gray-600">
          You'll be notified when seats become available
        </p>
      </div>

      {waitlistEntries.map((entry) => (
        <Card key={entry.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={entry.showtimes.movies.poster_url}
                    alt={entry.showtimes.movies.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-bold text-lg">
                      {entry.showtimes.movies.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {entry.showtimes.theaters.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        entry.showtimes.show_date
                      ).toLocaleDateString()}{' '}
                      at {entry.showtimes.show_time}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Position:</strong>
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        #{entry.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        Added:{' '}
                        {new Date(
                          entry.created_at
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold text-green-600 mt-2">
                        🔔 Will notify you
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => handleRemoveFromWaitlist(entry.id)}
                className="ml-4"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
