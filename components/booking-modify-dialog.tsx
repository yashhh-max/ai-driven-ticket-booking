'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface BookingModification {
  id: string;
  booking_id: string;
  old_show_date: string;
  new_show_date: string;
  old_show_time: string;
  new_show_time: string;
  old_seats: string[];
  new_seats: string[];
  modification_type: string;
  reason: string;
  created_at: string;
}

interface BookingModifyProps {
  bookingId: string;
  onModificationSuccess?: () => void;
}

export default function BookingModifyDialog({
  bookingId,
  onModificationSuccess,
}: BookingModifyProps) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newSeats, setNewSeats] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [modifications, setModifications] = useState<BookingModification[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) {
      fetchModificationHistory();
    }
  }, [open]);

  const fetchModificationHistory = async () => {
    try {
      const response = await fetch(
        `/api/booking-modifications?bookingId=${bookingId}`
      );
      const { data } = await response.json();
      setModifications(data || []);
    } catch (error) {
      console.error('Error fetching modifications:', error);
    }
  };

  const handleModify = async () => {
    if (!newDate && !newTime && !newSeats) {
      toast({
        title: 'Error',
        description: 'Please select at least one change',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/booking-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          newShowDate: newDate || null,
          newShowTime: newTime || null,
          newSeats: newSeats ? newSeats.split(',').map(s => s.trim()) : null,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to modify booking');

      toast({
        title: 'Success',
        description: 'Booking modification submitted',
      });

      // Reset form
      setNewDate('');
      setNewTime('');
      setNewSeats('');
      setReason('');
      setOpen(false);

      if (onModificationSuccess) {
        onModificationSuccess();
      }

      fetchModificationHistory();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to modify booking',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        ✏️ Modify Booking
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modify Booking</DialogTitle>
            <DialogDescription>
              Change your showtime, time, or seats before confirmation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">New Show Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">New Show Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                New Seats (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., A1, A2, B1"
                value={newSeats}
                onChange={(e) => setNewSeats(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reason for Change</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you need to modify your booking"
                className="w-full border rounded px-3 py-2 mt-1"
                rows={3}
              />
            </div>

            {modifications.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full"
              >
                📋 View Modification History ({modifications.length})
              </Button>
            )}

            {showHistory && modifications.length > 0 && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Recent Modifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {modifications.map((mod) => (
                    <div
                      key={mod.id}
                      className="text-sm bg-white p-2 rounded border"
                    >
                      <p className="font-semibold capitalize">
                        {mod.modification_type} changed
                      </p>
                      <p className="text-gray-600">
                        {new Date(mod.created_at).toLocaleString()}
                      </p>
                      {mod.reason && (
                        <p className="text-gray-500 italic">"{mod.reason}"</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleModify}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Submit Modification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
