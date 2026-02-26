import { Bell, X, CheckCheck, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/lib/contexts/notification-context'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  if (!notifications.length) {
    return (
      <Card className="p-6 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No notifications yet</p>
      </Card>
    )
  }

  const typeColors = {
    auto_booking: 'bg-blue-500/20 text-blue-500',
    ticket_release: 'bg-green-500/20 text-green-500',
    price_alert: 'bg-purple-500/20 text-purple-500',
    booking_confirmed: 'bg-amber-500/20 text-amber-500',
  }

  const typeLabels = {
    auto_booking: 'Auto-Booking',
    ticket_release: 'Ticket Release',
    price_alert: 'Price Alert',
    booking_confirmed: 'Booking Update',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 cursor-pointer transition-colors ${
              notification.is_read
                ? 'bg-card'
                : 'bg-primary/5 border-primary/20'
            } hover:bg-muted`}
            onClick={() => !notification.is_read && markAsRead(notification.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={typeColors[notification.type as keyof typeof typeColors]}
                    variant="outline"
                  >
                    {typeLabels[notification.type as keyof typeof typeLabels]}
                  </Badge>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotification(notification.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {notification.related_booking_id && (
              <Link href={`/confirmation/${notification.related_booking_id}`}>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  View Booking
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link href="/notifications/preferences">
          <Settings className="h-4 w-4 mr-2" />
          Notification Preferences
        </Link>
      </Button>
    </div>
  )
}

export function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  )
}
