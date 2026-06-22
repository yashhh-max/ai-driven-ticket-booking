import { createAdminClient } from './server';

export async function checkAndShiftShowtimes() {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if there are any future showtimes
    const { data: futureShowtimes, error: checkError } = await supabase
      .from('showtimes')
      .select('show_date')
      .gte('show_date', today)
      .limit(1);

    if (checkError) {
      console.error('[Showtime Auto-Shift] Error checking future showtimes:', checkError.message);
      return;
    }

    // If there is at least one future showtime, no need to shift anything!
    if (futureShowtimes && futureShowtimes.length > 0) {
      return;
    }

    console.log('[Showtime Auto-Shift] No future showtimes found. Auto-shifting dates forward...');

    // Find the earliest showtime date currently in the database to calculate offset
    const { data: earliestShowtime, error: earliestError } = await supabase
      .from('showtimes')
      .select('show_date')
      .order('show_date', { ascending: true })
      .limit(1);

    if (earliestError || !earliestShowtime || earliestShowtime.length === 0) {
      console.warn('[Showtime Auto-Shift] No showtimes found in database to shift.');
      return;
    }

    const earliestDateStr = earliestShowtime[0].show_date;
    const earliestDate = new Date(earliestDateStr);
    const currentDate = new Date();
    
    // Difference in milliseconds
    const diffTime = currentDate.getTime() - earliestDate.getTime();
    // Convert to days (rounding to integer)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return;
    }

    console.log(`[Showtime Auto-Shift] Shifting all showtimes forward by ${diffDays} days...`);

    // Fetch all showtimes
    const { data: showtimes, error: fetchError } = await supabase
      .from('showtimes')
      .select('id, show_date');

    if (fetchError || !showtimes) {
      console.error('[Showtime Auto-Shift] Failed to fetch showtimes for shift:', fetchError.message);
      return;
    }

    // Update showtimes in batches of 100
    const batchSize = 100;
    for (let i = 0; i < showtimes.length; i += batchSize) {
      const batch = showtimes.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (st: any) => {
          const originalDate = new Date(st.show_date);
          originalDate.setDate(originalDate.getDate() + diffDays);
          const newDateStr = originalDate.toISOString().split('T')[0];
          
          await supabase
            .from('showtimes')
            .update({ show_date: newDateStr })
            .eq('id', st.id);
        })
      );
    }

    console.log(`[Showtime Auto-Shift] Successfully shifted ${showtimes.length} showtime dates forward!`);
  } catch (error) {
    console.error('[Showtime Auto-Shift] Exception in checkAndShiftShowtimes:', error);
  }
}
