'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationPreferences } from '@/lib/types'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  loading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'updated_at'>) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const channel = supabase.channel('notifications')

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (mounted && notifData) {
        setNotifications(notifData as Notification[])
      }

      // Load preferences
      const { data: prefData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (mounted && prefData) {
        setPreferences(prefData as NotificationPreferences)
      }

      setLoading(false)
    }

    loadData()

    // Subscribe to real-time notifications
    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (mounted) {
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          if (mounted) {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            )
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    }
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }
  }

  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: user.id
      })

    if (!error) {
      // Real-time will handle adding it
    }
  }

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error, data } = await supabase
      .from('notification_preferences')
      .update({
        ...newPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error && data) {
      setPreferences(data as NotificationPreferences)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updatePreferences
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
