import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const movieId = searchParams.get('movieId');

    if (!location || !movieId) {
      return NextResponse.json(
        { error: 'Location and movieId are required' },
        { status: 400 }
      );
    }

    // Fetch theatres for the location
    const { data: theatres, error: theatresError } = await supabase
      .from('theaters')
      .select('*')
      .eq('location', location);

    if (theatresError) {
      throw theatresError;
    }

    // Fetch showtimes for each theatre
    const theatresWithShowtimes = await Promise.all(
      (theatres || []).map(async (theatre) => {
        const { data: showtimes, error: showtimesError } = await supabase
          .from('showtimes')
          .select('*')
          .eq('theater_id', theatre.id)
          .eq('movie_id', movieId)
          .eq('is_active', true)
          .order('show_date', { ascending: true })
          .order('show_time', { ascending: true });

        if (showtimesError) {
          console.error('Error fetching showtimes:', showtimesError);
          return { ...theatre, showtimes: [] };
        }

        return { ...theatre, showtimes: showtimes || [] };
      })
    );

    // Filter theatres that have showtimes
    const theatresWithAvailableShowtimes = theatresWithShowtimes.filter(
      (t) => t.showtimes.length > 0
    );

    return NextResponse.json({
      success: true,
      data: theatresWithAvailableShowtimes,
    });
  } catch (error) {
    console.error('Error fetching theatres:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theatres' },
      { status: 500 }
    );
  }
}
