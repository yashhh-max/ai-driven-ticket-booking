'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Clock, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Theatre {
  id: string;
  name: string;
  location: string;
  total_rows: number;
  seats_per_row: number;
}

interface Showtime {
  id: string;
  movie_id: string;
  theater_id: string;
  show_date: string;
  show_time: string;
  price: number;
  theater?: Theatre;
}

interface TheatreListProps {
  movieId: string;
  movieTitle: string;
  location: string;
}

export function TheatreList({ movieId, movieTitle, location }: TheatreListProps) {
  const [theatres, setTheatres] = useState<(Theatre & { showtimes: Showtime[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTheatres = async () => {
      setLoading(true);
      try {
        // Fetch theatres for the selected location
        const response = await fetch(
          `/api/theatres?location=${location}&movieId=${movieId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch theatres');
        }

        const data = await response.json();
        setTheatres(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch theatres');
        setTheatres([]);
      } finally {
        setLoading(false);
      }
    };

    if (location && location !== 'all') {
      fetchTheatres();
    }
  }, [movieId, location]);

  if (location === 'all') {
    return (
      <div className="text-center py-8 text-gray-600">
        Please select a specific location to see available theatres
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (theatres.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No theatres available in {location} for this movie
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Available Theatres in {location.charAt(0).toUpperCase() + location.slice(1)}
      </h3>

      {theatres.map((theatre) => (
        <div
          key={theatre.id}
          className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          {/* Theatre Info */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">{theatre.name}</h4>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {theatre.location}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {theatre.seats_per_row} seats per row • {theatre.total_rows} rows
              </p>
            </div>
          </div>

          {/* Showtimes Grid */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Available Showtimes:</p>
            {theatre.showtimes && theatre.showtimes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {theatre.showtimes.map((showtime) => (
                  <Link
                    key={showtime.id}
                    href={`/book/${showtime.id}`}
                  >
                    <button className="w-full p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock size={14} className="text-blue-600" />
                        <span className="font-bold text-gray-900">{showtime.show_time}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        ₹{showtime.price}
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No showtimes available</p>
            )}
          </div>

          {/* Book Button */}
          {theatre.showtimes && theatre.showtimes.length > 0 && (
            <Link href={`/book/${theatre.showtimes[0].id}`}>
              <Button className="w-full mt-4">
                <TicketCheck size={16} className="mr-2" />
                Book Now
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
