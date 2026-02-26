'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Film, Ticket, User as UserIcon, LogOut, Wallet, Zap, Brain, Menu } from 'lucide-react'
import { NotificationBell } from '@/components/notification-center'

export function HeaderClient() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">AuroSeat</span>
          </Link>
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">AuroSeat</span>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Hamburger Menu - Show for All Users */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-foreground">
                <Menu className="h-5 w-5" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/auto-book" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Auto-Book
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ai-features" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Chatbot
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    My Wallet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auto-book" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Auto-Book
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-features" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Features
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
