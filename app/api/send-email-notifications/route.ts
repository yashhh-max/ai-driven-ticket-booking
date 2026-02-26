import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Send email notifications for pending delivery
 * Can be called by a cron job or on-demand
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // This is meant to be called by scheduled jobs
    // In production, use a service like Resend or SendGrid
    
    // Get all notifications pending email delivery
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*, users(email)')
      .contains('delivery_methods', ['email'])
      .neq('delivery_status', { email: 'sent' })
      .limit(50)

    if (fetchError) {
      console.error('[email-notifications] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending email notifications',
        sent: 0 
      })
    }

    let sentCount = 0
    const errors = []

    for (const notification of notifications) {
      try {
        // Send email notification
        // Example using Resend (you'll need to set this up)
        const emailResponse = await sendEmailNotification(
          notification.users?.email,
          notification.title,
          notification.message,
          notification.type
        )

        if (emailResponse.success) {
          // Update delivery status
          await supabase
            .from('notifications')
            .update({
              delivery_status: {
                ...notification.delivery_status,
                email: 'sent'
              }
            })
            .eq('id', notification.id)

          sentCount++
        } else {
          errors.push({
            notificationId: notification.id,
            error: emailResponse.error
          })
        }
      } catch (error) {
        console.error(`[email-notifications] Error sending to ${notification.id}:`, error)
        errors.push({
          notificationId: notification.id,
          error: String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} email notifications`,
      sent: sentCount,
      total: notifications.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[email-notifications] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send an email notification
 * This is a placeholder - integrate with your email service
 */
async function sendEmailNotification(
  email: string | undefined,
  title: string,
  message: string,
  type: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: 'No email address' }
  }

  try {
    // Example using Resend (requires RESEND_API_KEY env var)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'notifications@cinetickets.com',
          to: email,
          subject: title,
          html: `
            <h2>${title}</h2>
            <p>${message}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #0066cc;">
                View in App
              </a>
            </p>
          `
        })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    }

    // Fallback: Could integrate with other services here
    console.log(`[email-notifications] Would send to ${email}:`, { title, message })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function GET(request: Request) {
  // Trigger email sending (for testing or manual triggers)
  return POST(request)
}
