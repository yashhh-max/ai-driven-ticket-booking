# Real-Time Notification System - Setup Guide

## Overview

Complete real-time notification system with multiple delivery channels:
- 🔔 **In-App Notifications** - Instant toast messages + notification center
- 📱 **Push Notifications** - Real-time browser notifications
- 📧 **Email Notifications** - Transactional emails via Resend/SendGrid

## Features

### Notification Types
1. **Auto-Booking Status** - When pre-bookings are processed, confirmed, or fail
2. **Ticket Release Alerts** - When tickets for wishlist movies are released
3. **Price Alerts** - When prices drop to user's target
4. **Booking Updates** - Confirmations and important updates

### Delivery Methods
Users can configure which channels receive which notifications:
- Enable/disable each notification type
- Choose delivery methods per notification type
- Global enable/disable for push and email channels

---

## Setup Instructions

### Step 1: Apply Database Migration

```sql
-- Run in Supabase SQL Editor
-- Copy contents of: scripts/015_add_notifications_system.sql
```

This creates:
- `notifications` table - stores all notifications
- `notification_preferences` table - user preferences
- `create_notification()` function - creates notifications
- RLS policies - secure notifications access

### Step 2: Update Environment Variables

Add to `.env.local`:

```env
# For email notifications (optional - uses Resend)
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For push notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### Step 3: Add NotificationProvider

Update `app/layout.tsx`:

```tsx
import { NotificationProvider } from '@/lib/contexts/notification-context'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
```

### Step 4: Add Notification UI

Add to your header or main component:

```tsx
import { NotificationBell } from '@/components/notification-center'

export function Header() {
  return (
    <header>
      {/* Other header content */}
      <NotificationBell />
    </header>
  )
}
```

### Step 5: Create Notifications Page

The notification preferences page is at:
```
app/notifications/preferences/page.tsx
```
Already created and ready to use!

---

## Usage

### Send Notifications Automatically

Notifications are automatically created when:
1. **Auto-booking completes** - Success notification sent
2. **Auto-booking fails** - Failure notification with reason
3. **Ticket releases** - Alert to subscribed users
4. **Price drops** - Alert to users with price targets

### Send Notifications Manually

```tsx
import { useNotifications } from '@/lib/contexts/notification-context'

function MyComponent() {
  const { addNotification } = useNotifications()

  const handleClick = async () => {
    await addNotification({
      type: 'auto_booking',
      title: 'Booking Confirmed',
      message: 'Your auto-booking has been confirmed!',
      related_booking_id: bookingId
    })
  }

  return <button onClick={handleClick}>Notify Me</button>
}
```

### Access Notifications

```tsx
import { useNotifications } from '@/lib/contexts/notification-context'

function NotificationList() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification 
  } = useNotifications()

  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => deleteNotification(notif.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

---

## Email Notifications Setup

### Option 1: Using Resend (Recommended)

1. Create account at https://resend.com
2. Get API key from dashboard
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
4. Set up cron job to send pending emails:
   ```bash
   # Call daily or hourly
   curl https://yourapp.com/api/send-email-notifications
   ```

### Option 2: Using SendGrid

Replace `sendEmailNotification()` in `app/api/send-email-notifications/route.ts`:

```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: 'notifications@example.com',
  subject: title,
  html: message
});
```

---

## Push Notifications Setup

### Requires VAPID Keys

Generate VAPID keys using `web-push`:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Add to `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BCxxxxxx...
VAPID_PRIVATE_KEY=xxxxxx...
```

### Enable Push Notifications

Call in your app:
```tsx
import { subscribeToPushNotifications } from '@/lib/utils/push-notifications'

const handleEnablePush = async () => {
  await subscribeToPushNotifications()
}
```

---

## Database Schema

### notifications table
```
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- type: TEXT (auto_booking|ticket_release|price_alert|booking_confirmed)
- title: TEXT
- message: TEXT
- related_booking_id: UUID (Optional)
- related_pre_booking_id: UUID (Optional)
- related_movie_id: UUID (Optional)
- is_read: BOOLEAN
- delivery_methods: TEXT[] (in_app|push|email)
- delivery_status: JSONB ({push: pending, email: sent, ...})
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### notification_preferences table
```
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key, Unique)
- auto_booking_enabled: BOOLEAN
- auto_booking_method: TEXT[]
- ticket_release_enabled: BOOLEAN
- ticket_release_method: TEXT[]
- price_alert_enabled: BOOLEAN
- price_alert_method: TEXT[]
- booking_updates_enabled: BOOLEAN
- booking_updates_method: TEXT[]
- push_enabled: BOOLEAN
- email_enabled: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## Real-Time Features

### Subscribe to Notifications
Uses Supabase real-time subscriptions automatically:
```tsx
// NotificationContext already handles this
// Notifications appear instantly as they're created
```

### Mark as Read
```tsx
const { markAsRead, markAllAsRead } = useNotifications()

// Mark single
await markAsRead(notificationId)

// Mark all
await markAllAsRead()
```

### Delete Notifications
```tsx
const { deleteNotification } = useNotifications()

await deleteNotification(notificationId)
```

---

## API Endpoints

### GET/POST /api/send-email-notifications
Sends pending email notifications
- Looks for notifications with `email` in `delivery_methods`
- Updates `delivery_status` to `sent`
- Can be called by cron job

### POST /api/subscribe-push
Subscribe device to push notifications
- Receives push subscription from browser
- Stores for later sending

### POST /api/unsubscribe-push
Unsubscribe device from push notifications

---

## Cron Jobs

### Send Email Notifications
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/send-email-notifications",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

### Process Pre-Bookings (Already Configured)
```json
{
  "path": "/api/process-prebookings",
  "schedule": "*/1 * * * *"  // Every minute
}
```

---

## Testing

### Test In-App Notification
1. Go to `/notifications/preferences`
2. Enable auto-booking notifications
3. Click "Process Now" on a pre-booking
4. Should see toast notification

### Test Push Notification
1. Enable push notifications in settings
2. Browser will request permission
3. Send notification - should appear as system notification

### Test Email Notification
1. Check RESEND_API_KEY is set
2. Enable email for a notification type
3. Create notification
4. Manually call `/api/send-email-notifications`
5. Check email

---

## Troubleshooting

**Notifications not appearing?**
- Check NotificationProvider is wrapping app
- Verify RLS policies on notifications table
- Check browser console for errors

**Email not sending?**
- Verify RESEND_API_KEY is set
- Check /api/send-email-notifications logs
- Ensure email notifications are enabled in preferences

**Push not working?**
- Check VAPID keys are set correctly
- Verify service worker is running
- Check browser notification permission

---

## Files Created

```
scripts/
  015_add_notifications_system.sql      # Database schema

lib/
  contexts/
    notification-context.tsx            # React context
  utils/
    push-notifications.ts               # Push utilities
  types.ts                              # Updated with types

components/
  notification-center.tsx               # UI components

app/
  api/
    send-email-notifications/route.ts   # Email sending
    subscribe-push/route.ts             # Push subscription
    unsubscribe-push/route.ts           # Push unsubscription
  notifications/
    preferences/page.tsx                # Settings page
```

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Set up .env variables (optional for push/email)
3. ✅ Add NotificationProvider to layout
4. ✅ Add NotificationBell to header
5. ✅ Configure cron jobs for email (optional)
6. ✅ Test notifications

Enjoy real-time notifications! 🚀
