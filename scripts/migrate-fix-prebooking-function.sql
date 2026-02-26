-- Migration: Fix process_pre_booking function
-- This fixes the SUBSTR() issue (should be SUBSTRING in PostgreSQL)
-- and improves booking reference generation

DROP FUNCTION IF EXISTS process_pre_booking(UUID);

CREATE OR REPLACE FUNCTION process_pre_booking(p_pre_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pre_booking RECORD;
  v_seat RECORD;
  v_booking_id UUID;
  v_wallet_result JSON;
  v_seat_available BOOLEAN;
  v_error_msg TEXT;
BEGIN
  -- Get pre-booking details
  SELECT pb.*, s.ticket_release_time, s.show_date, s.show_time
  INTO v_pre_booking
  FROM pre_bookings pb
  JOIN showtimes s ON s.id = pb.showtime_id
  WHERE pb.id = p_pre_booking_id
  FOR UPDATE;
  
  IF v_pre_booking IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pre-booking not found');
  END IF;
  
  IF v_pre_booking.status != 'queued' THEN
    RETURN json_build_object('success', false, 'error', 'Pre-booking already processed');
  END IF;
  
  -- Check if tickets are released
  IF v_pre_booking.ticket_release_time > NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Tickets not yet released');
  END IF;
  
  -- Update status to processing
  UPDATE pre_bookings SET status = 'processing', updated_at = NOW()
  WHERE id = p_pre_booking_id;
  
  -- Check if all seats are available
  FOR v_seat IN 
    SELECT pbs.seat_id, pbs.price
    FROM pre_booked_seats pbs
    WHERE pbs.pre_booking_id = p_pre_booking_id
  LOOP
    -- Check if seat is already booked
    SELECT NOT EXISTS (
      SELECT 1 FROM booked_seats bs
      JOIN bookings b ON b.id = bs.booking_id
      WHERE bs.seat_id = v_seat.seat_id
        AND b.showtime_id = v_pre_booking.showtime_id
        AND b.status IN ('pending', 'confirmed')
    ) INTO v_seat_available;
    
    IF NOT v_seat_available THEN
      -- Mark as failed
      UPDATE pre_bookings 
      SET status = 'failed', 
          failure_reason = 'One or more seats are no longer available',
          processed_at = NOW(),
          updated_at = NOW()
      WHERE id = p_pre_booking_id;
      
      RETURN json_build_object('success', false, 'error', 'Seats not available');
    END IF;
  END LOOP;
  
  -- Deduct from wallet
  SELECT deduct_from_wallet(
    v_pre_booking.user_id,
    v_pre_booking.total_amount,
    NULL,
    'Auto-booking for showtime'
  ) INTO v_wallet_result;
  
  IF NOT (v_wallet_result->>'success')::boolean THEN
    UPDATE pre_bookings 
    SET status = 'failed', 
        failure_reason = v_wallet_result->>'error',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_pre_booking_id;
    
    RETURN json_build_object('success', false, 'error', v_wallet_result->>'error');
  END IF;
  
  -- Create the actual booking with improved reference generation
  BEGIN
    INSERT INTO bookings (user_id, showtime_id, total_amount, status, booking_reference)
    VALUES (
      v_pre_booking.user_id, 
      v_pre_booking.showtime_id, 
      v_pre_booking.total_amount, 
      'confirmed', 
      'AB' || REPLACE(v_pre_booking.user_id::text, '-', '') || SUBSTRING(p_pre_booking_id::text FROM 1 FOR 6)
    )
    RETURNING id INTO v_booking_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    UPDATE pre_bookings 
    SET status = 'failed', 
        failure_reason = 'Failed to create booking: ' || v_error_msg,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_pre_booking_id;
    
    RETURN json_build_object('success', false, 'error', 'Failed to create booking: ' || v_error_msg);
  END;
  
  -- Create booked seats
  BEGIN
    INSERT INTO booked_seats (booking_id, showtime_id, seat_id)
    SELECT v_booking_id, v_pre_booking.showtime_id, pbs.seat_id
    FROM pre_booked_seats pbs
    WHERE pbs.pre_booking_id = p_pre_booking_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    -- Delete the booking if seat insertion fails
    DELETE FROM bookings WHERE id = v_booking_id;
    
    UPDATE pre_bookings 
    SET status = 'failed', 
        failure_reason = 'Failed to create booked seats: ' || v_error_msg,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_pre_booking_id;
    
    RETURN json_build_object('success', false, 'error', 'Failed to create booked seats: ' || v_error_msg);
  END;
  
  -- Update pre-booking as completed
  UPDATE pre_bookings 
  SET status = 'completed', 
      booking_id = v_booking_id,
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_pre_booking_id;
  
  -- Update wallet transaction with booking_id
  UPDATE wallet_transactions
  SET booking_id = v_booking_id
  WHERE id = (
    SELECT wt.id FROM wallet_transactions wt
    WHERE wt.wallet_id = (SELECT w.id FROM wallets w WHERE w.user_id = v_pre_booking.user_id)
      AND wt.booking_id IS NULL
      AND wt.type = 'deduction'
    ORDER BY wt.created_at DESC
    LIMIT 1
  );
  
  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;
