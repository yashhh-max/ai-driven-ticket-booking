import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authorization (optional - remove this check if you want public access)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.SEED_TOKEN}` && process.env.SEED_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Insert Theaters
    await supabase.from('theaters').upsert([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Screen 1 - IMAX',
        total_rows: 12,
        seats_per_row: 16,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Screen 2 - Dolby Atmos',
        total_rows: 10,
        seats_per_row: 14,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Screen 3 - Standard',
        total_rows: 8,
        seats_per_row: 12,
      },
    ])

    // 2. Insert Movies
    await supabase.from('movies').upsert([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: 'Dune: Part Three',
        description:
          'The epic conclusion to the Dune saga. Paul Atreides must lead the Fremen in the final battle for Arrakis while confronting the dark prophecy of his future.',
        genre: 'Sci-Fi',
        duration_minutes: 175,
        rating: 'PG-13',
        poster_url: '/posters/dune3.jpg',
        backdrop_url: '/backdrops/dune3.jpg',
        release_date: '2026-01-15',
        is_now_showing: true,
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'The Last Horizon',
        description:
          'A gripping space thriller about astronauts stranded on Mars who must find a way home before their supplies run out.',
        genre: 'Sci-Fi',
        duration_minutes: 142,
        rating: 'PG-13',
        poster_url: '/posters/horizon.jpg',
        backdrop_url: '/backdrops/horizon.jpg',
        release_date: '2026-01-20',
        is_now_showing: true,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        title: 'Midnight in Paris 2',
        description:
          'Owen Wilson returns for another magical journey through time in the City of Lights.',
        genre: 'Romance',
        duration_minutes: 118,
        rating: 'PG',
        poster_url: '/posters/paris2.jpg',
        backdrop_url: '/backdrops/paris2.jpg',
        release_date: '2026-01-10',
        is_now_showing: true,
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        title: 'Shadow Protocol',
        description:
          'A former CIA operative is pulled back into action when a ghost from her past threatens global security.',
        genre: 'Action',
        duration_minutes: 128,
        rating: 'R',
        poster_url: '/posters/shadow.jpg',
        backdrop_url: '/backdrops/shadow.jpg',
        release_date: '2026-01-25',
        is_now_showing: true,
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        title: 'The Laughing Man',
        description:
          'A dark comedy about a failed comedian who accidentally becomes a viral sensation.',
        genre: 'Comedy',
        duration_minutes: 105,
        rating: 'R',
        poster_url: '/posters/laughing.jpg',
        backdrop_url: '/backdrops/laughing.jpg',
        release_date: '2026-01-18',
        is_now_showing: true,
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        title: 'Echoes of Tomorrow',
        description: 'A mind-bending thriller where a woman receives messages from her future self.',
        genre: 'Thriller',
        duration_minutes: 134,
        rating: 'PG-13',
        poster_url: '/posters/echoes.jpg',
        backdrop_url: '/backdrops/echoes.jpg',
        release_date: '2026-02-01',
        is_now_showing: true,
      },
    ])

    // 3. Generate and insert seats for all theaters
    const theaterConfigs = [
      { id: '11111111-1111-1111-1111-111111111111', rows: 12, seatsPerRow: 16 },
      { id: '22222222-2222-2222-2222-222222222222', rows: 10, seatsPerRow: 14 },
      { id: '33333333-3333-3333-3333-333333333333', rows: 8, seatsPerRow: 12 },
    ]

    for (const theater of theaterConfigs) {
      const seats = []
      for (let row = 1; row <= theater.rows; row++) {
        for (let seat = 1; seat <= theater.seatsPerRow; seat++) {
          let seatType = 'standard'
          if (theater.id === '11111111-1111-1111-1111-111111111111') {
            // Screen 1 IMAX
            if (row <= 3) seatType = 'standard'
            else if (row <= 9) seatType = 'premium'
            else seatType = 'vip'
          } else if (theater.id === '22222222-2222-2222-2222-222222222222') {
            // Screen 2 Dolby
            if (row <= 3) seatType = 'standard'
            else if (row <= 7) seatType = 'premium'
            else seatType = 'vip'
          } else {
            // Screen 3 Standard
            if (row <= 2) seatType = 'standard'
            else if (row <= 6) seatType = 'premium'
            else seatType = 'vip'
          }

          seats.push({
            theater_id: theater.id,
            row_label: String.fromCharCode(64 + row), // A, B, C...
            seat_number: seat,
            seat_type: seatType,
          })
        }
      }

      // Batch insert seats
      if (seats.length > 0) {
        const batchSize = 500
        for (let i = 0; i < seats.length; i += batchSize) {
          await supabase.from('seats').upsert(seats.slice(i, i + batchSize))
        }
      }
    }

    // 4. Generate and insert showtimes for next 7 days
    const movieIds = [
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
    ]

    const theaterIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ]

    const showtimes = []
    const timeslots = ['10:30', '13:15', '16:00', '19:00', '21:45']

    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const showDate = new Date()
      showDate.setDate(showDate.getDate() + dayOffset)
      const dateStr = showDate.toISOString().split('T')[0]

      for (const movieId of movieIds) {
        for (const theaterId of theaterIds) {
          for (const timeSlot of timeslots) {
            // Determine price based on theater
            let price = 250.0
            if (theaterId === '11111111-1111-1111-1111-111111111111') price = 350.0 // IMAX
            else if (theaterId === '22222222-2222-2222-2222-222222222222') price = 325.0 // Dolby

            showtimes.push({
              movie_id: movieId,
              theater_id: theaterId,
              show_date: dateStr,
              show_time: timeSlot,
              price: price,
              is_active: true,
            })
          }
        }
      }
    }

    // Batch insert showtimes
    if (showtimes.length > 0) {
      const batchSize = 500
      for (let i = 0; i < showtimes.length; i += batchSize) {
        await supabase.from('showtimes').upsert(showtimes.slice(i, i + batchSize), {
          onConflict: 'movie_id,theater_id,show_date,show_time',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      counts: {
        theaters: 3,
        movies: 6,
        seatsGenerated: theaterConfigs.reduce((acc, t) => acc + t.rows * t.seatsPerRow, 0),
        showtimesGenerated: showtimes.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
