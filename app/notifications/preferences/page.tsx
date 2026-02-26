'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/lib/contexts/notification-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Smartphone, AlertCircle } from 'lucide-react'

const NOTIFICATION_TYPES = [
  { key: 'auto_booking', label: 'Auto-Booking Updates', description: 'Get notified when your pre-bookings are processed' },
  { key: 'ticket_release', label: 'Ticket Release Alerts', description: 'Be notified when tickets for your wishlist movies are released' },
  { key: 'price_alert', label: 'Price Alerts', description: 'Get notified when prices drop to your target' },
  { key: 'booking_updates', label: 'Booking Updates', description: 'Notifications about your confirmed bookings' },
]

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { preferences, updatePreferences } = useNotifications()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin">⏳</div>
      </div>
    )
  }

  const handleToggleType = (typeKey: string) => {
    const key = `${typeKey.slice(0, typeKey.lastIndexOf('_'))}_enabled` as any
    if (!preferences) return

    updatePreferences({
      [key]: !preferences[key as keyof typeof preferences]
    })
  }

  const handleToggleMethod = (typeKey: string, method: string) => {
    const methodKey = `${typeKey}_method` as any
    if (!preferences) return

    const current = preferences[methodKey as keyof typeof preferences] as string[] || []
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method]

    updatePreferences({
      [methodKey]: updated
    })
  }

  const handleToggleChannel = (channel: string) => {
    const key = `${channel}_enabled`
    if (!preferences) return

    updatePreferences({
      [key]: !preferences[key as keyof typeof preferences]
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Notification Preferences</h1>
          <p className="mt-2 text-muted-foreground">
            Customize how and when you want to receive notifications
          </p>
        </div>

        {!preferences && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Loading your preferences...
              </p>
            </CardContent>
          </Card>
        )}

        {preferences && (
          <>
            {/* Notification Types */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Types
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {NOTIFICATION_TYPES.map((type) => {
                  const enabledKey = `${type.key.split('_').slice(0, -1).join('_')}_enabled`
                  const methodKey = `${type.key}_method`
                  const isEnabled = preferences[enabledKey as keyof typeof preferences]
                  const methods = preferences[methodKey as keyof typeof preferences] as string[] || []

                  return (
                    <div key={type.key} className="flex items-start justify-between pb-4 border-b last:border-b-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{type.label}</h3>
                          <Badge variant={isEnabled as any ? 'default' : 'secondary'}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>

                        {isEnabled && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(['in_app', 'push', 'email']).map((method) => (
                              <Button
                                key={method}
                                variant={methods.includes(method) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleToggleMethod(type.key, method)}
                                disabled={method === 'push' && !preferences.push_enabled}
                                className="gap-2"
                              >
                                {method === 'in_app' && <Bell className="h-4 w-4" />}
                                {method === 'push' && <Smartphone className="h-4 w-4" />}
                                {method === 'email' && <Mail className="h-4 w-4" />}
                                {method.charAt(0).toUpperCase() + method.slice(1)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Switch
                        checked={isEnabled as boolean}
                        onCheckedChange={() => handleToggleType(type.key)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Delivery Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Methods</CardTitle>
                <CardDescription>
                  Configure which channels can send you notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="h-5 w-5" />
                      <h3 className="font-semibold">Push Notifications</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time push notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push_enabled}
                    onCheckedChange={() => handleToggleChannel('push')}
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-5 w-5" />
                      <h3 className="font-semibold">Email Notifications</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email_enabled}
                    onCheckedChange={() => handleToggleChannel('email')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Status */}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button disabled={saving}>
                {saving ? 'Saving...' : 'Preferences Updated'}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
