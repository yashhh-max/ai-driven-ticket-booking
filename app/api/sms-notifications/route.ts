import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simulate sending SMS notification and log it
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { phoneNumber, message, userId, bookingId } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'Missing phone number or message' }, { status: 400 });
    }

    console.log(`[SMS Gateway] Sending SMS to ${phoneNumber}: "${message}"`);

    let loggedInDB = false;
    let dbError = null;

    // 1. Try to log to the Supabase database
    if (userId) {
      try {
        const { error } = await supabase
          .from('sms_notifications')
          .insert({
            user_id: userId,
            phone_number: phoneNumber,
            message: message,
            status: 'sent'
          });

        if (!error) {
          loggedInDB = true;
          console.log('[SMS Gateway] Logged to database successfully');
        } else {
          dbError = error.message;
          console.warn('[SMS Gateway] DB Insert Warning:', error.message);
        }
      } catch (err: any) {
        dbError = err.message;
        console.warn('[SMS Gateway] Database table lock or connection error:', err.message);
      }
    }

    // 2. Local fallback log (so we always have an audit trace even if DB table hasn't been migrated)
    try {
      const logPath = path.join(process.cwd(), 'sms-logs.json');
      let logs = [];
      if (fs.existsSync(logPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
          logs = [];
        }
      }

      logs.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: userId || 'anonymous',
        bookingId: bookingId || null,
        phoneNumber,
        message,
        status: 'sent',
        timestamp: new Date().toISOString(),
        fallback: !loggedInDB
      });

      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
      console.log('[SMS Gateway] Logged to local JSON file successfully');
    } catch (fsErr: any) {
      console.error('[SMS Gateway] Failed writing to local JSON:', fsErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully (simulated)',
      status: 'sent',
      loggedInDB,
      dbError
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in SMS notifications:', error);
    return NextResponse.json({ error: error.message || 'SMS transmission failed' }, { status: 500 });
  }
}
