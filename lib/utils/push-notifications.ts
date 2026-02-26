/**
 * Push notification utilities
 * Uses the Web Push API with Service Worker
 */

export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: {
    action: string
    title: string
  }[]
  data?: Record<string, any>
}

/**
 * Request permission to send push notifications
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted'
}

/**
 * Send a local push notification
 */
export async function sendPushNotification(options: PushNotificationOptions): Promise<void> {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported or not enabled')
    return
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
        actions: options.actions,
        data: options.data,
      })
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    // Fallback to a simple notification if service worker fails
    if (Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
      })
    }
  }
}

/**
 * Subscribe to push notifications on the server
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      // Send subscription to server
      const response = await fetch('/api/subscribe-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe to push notifications')
      }
    }

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // Notify server
      await fetch('/api/unsubscribe-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return false
  }
}
