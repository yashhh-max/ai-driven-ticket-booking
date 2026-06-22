'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { CreditCard, Loader2, Lock, Gift, MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Showtime, Theater, BookedSeat, Seat } from '@/lib/types'
import { Checkout3DAnimation } from '@/components/checkout-3d-animation'

interface CheckoutClientProps {
  booking: Booking & {
    showtime?: Showtime & { theater?: Theater }
    booked_seats?: (BookedSeat & { seat?: Seat })[]
  }
}

export function CheckoutClient({ booking }: CheckoutClientProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [animationStatus, setAnimationStatus] = useState<'processing' | 'success' | 'failed' | null>(null)
  const [availablePoints, setAvailablePoints] = useState(0)
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [optInSMS, setOptInSMS] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const supabase = createClient()

  // Fetch loyalty points and phone number
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch phone from profile if it exists
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('phone_number')
            .eq('id', user.id)
            .single()
          
          if (profile?.phone_number) {
            setPhoneNumber(profile.phone_number)
            setOptInSMS(true)
          }

          // Fetch loyalty points balance
          const res = await fetch('/api/loyalty')
          const data = await res.json()
          if (data?.success) {
            setAvailablePoints(data.profile.available_points || 0)
          }
        }
      } catch (err) {
        console.error('Error fetching checkout user data:', err)
      }
    }
    fetchUserData()
  }, [supabase])

  const pointsDiscount = redeemPoints ? Math.min(Math.floor(availablePoints / 10), booking.total_amount + 69) : 0
  const finalAmount = booking.total_amount + 69 - pointsDiscount
  const pointsToRedeemValue = pointsDiscount * 10

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : v
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number')
      return
    }
    if (expiry.length < 5) {
      toast.error('Please enter a valid expiry date')
      return
    }
    if (cvv.length < 3) {
      toast.error('Please enter a valid CVV')
      return
    }
    if (!name.trim()) {
      toast.error('Please enter the cardholder name')
      return
    }
    if (optInSMS && !phoneNumber.trim()) {
      toast.error('Please enter a valid phone number for SMS notifications')
      return
    }

    setIsProcessing(true)
    setAnimationStatus('processing')

    try {
      // Simulate payment processing (in production, integrate with Stripe/payment provider)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update booking status and final amount paid
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          total_amount: finalAmount - 69 // Store seat total excluding fee
        })
        .eq('id', booking.id)

      if (updateError) {
        console.error('Booking update error:', updateError)
        throw new Error(updateError.message || 'Failed to update booking')
      }

      // Handle loyalty points redemption
      if (redeemPoints && pointsToRedeemValue > 0) {
        try {
          await fetch('/api/loyalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: booking.id,
              action: 'redeem',
              points: pointsToRedeemValue
            })
          })
          console.log(`[Loyalty] Redeemed ${pointsToRedeemValue} points successfully`)
        } catch (loyErr) {
          console.error('[Loyalty] Redemption error:', loyErr)
        }
      }

      // Award loyalty points (10% of final amount paid)
      const earnedPoints = Math.round(finalAmount * 0.1)
      if (earnedPoints > 0) {
        try {
          await fetch('/api/loyalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: booking.id,
              action: 'earn',
              points: earnedPoints
            })
          })
          console.log(`[Loyalty] Earned ${earnedPoints} points successfully`)
        } catch (loyErr) {
          console.error('[Loyalty] Earn points error:', loyErr)
        }
      }

      // Clear any remaining seat locks
      const { error: lockError } = await supabase
        .from('seat_locks')
        .delete()
        .eq('showtime_id', booking.showtime_id)
        .eq('user_id', booking.user_id)

      if (lockError) {
        console.error('Seat lock deletion error:', lockError)
      }

      // Generate QR code after booking confirmation
      if (booking.id) {
        try {
          console.log('[QR] Starting QR code generation for booking:', booking.id)
          
          const qrResponse = await fetch(`/api/bookings/${booking.id}/generate-qr`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (qrResponse.ok) {
            console.log('[QR] ✅ QR code generated successfully')
          }
        } catch (qrError) {
          console.error('[QR] QR generation exception:', qrError)
        }
      }

      // Send SMS Confirmation if opted in
      if (optInSMS && phoneNumber) {
        try {
          const seatLabels = booking.booked_seats
            ?.map((bs: any) => `${bs.seat?.row_label || ''}${bs.seat?.seat_number || ''}`)
            .filter(Boolean)
            .join(', ') || 'selected seats'

          const movieTitle = booking.showtime?.movie?.title || 'Movie'

          await fetch('/api/sms-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber,
              message: `AuroSeat: Ticket confirmed! Movie: ${movieTitle}. Seats: ${seatLabels}. Ref: ${booking.booking_reference}. Thank you for booking!`,
              userId: booking.user_id,
              bookingId: booking.id
            })
          })
          console.log('[SMS] Confirmed SMS request dispatched')
        } catch (smsErr) {
          console.error('[SMS] Confirm SMS error:', smsErr)
        }
      }

      setAnimationStatus('success')
      toast.success('Payment successful!')
      
      // Delay redirect to let success animation play
      await new Promise((resolve) => setTimeout(resolve, 2500))
      router.push(`/confirmation/${booking.id}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Payment error:', errorMessage)
      setAnimationStatus('failed')
      toast.error(`Payment failed: ${errorMessage}`)
      
      // Reset animation overlay after delay to allow retry
      await new Promise((resolve) => setTimeout(resolve, 2500))
      setAnimationStatus(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    try {
      // Update booking status to cancelled
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)

      if (cancelError) {
        console.error('Cancel error:', cancelError)
        throw new Error(cancelError.message || 'Failed to cancel booking')
      }

      // Clear seat locks
      const { error: lockError } = await supabase
        .from('seat_locks')
        .delete()
        .eq('showtime_id', booking.showtime_id)
        .eq('user_id', booking.user_id)

      if (lockError) {
        console.error('Seat lock error during cancel:', lockError)
        // Don't throw here as locks are not critical
      }

      toast.info('Booking cancelled')
      router.push('/')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Cancel error:', errorMessage)
      toast.error(`Failed to cancel booking: ${errorMessage}`)
    }
  }

  if (animationStatus) {
    return (
      <Checkout3DAnimation
        status={animationStatus}
        bookingId={booking.id}
        totalAmount={finalAmount}
      />
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                disabled={isProcessing}
              />
            </div>
          </div>

          {availablePoints > 0 && (
            <div className="flex items-center space-x-2 rounded-md border border-cyan-500/20 bg-cyan-950/10 p-3">
              <Checkbox
                id="redeemPoints"
                checked={redeemPoints}
                onCheckedChange={(checked) => setRedeemPoints(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="redeemPoints"
                  className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="h-4 w-4" />
                  Redeem Loyalty Points
                </label>
                <p className="text-xs text-muted-foreground">
                  Use {availablePoints} available points to save {formatCurrency(Math.floor(availablePoints / 10))}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="optInSMS"
                checked={optInSMS}
                onCheckedChange={(checked) => setOptInSMS(!!checked)}
              />
              <label
                htmlFor="optInSMS"
                className="text-sm font-medium text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                Receive tickets & reminders via SMS
              </label>
            </div>
            {optInSMS && (
              <div className="space-y-1.5 pl-6">
                <Label htmlFor="smsPhone" className="text-xs">Mobile Number</Label>
                <Input
                  id="smsPhone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isProcessing}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${formatCurrency(finalAmount)}`
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel Booking
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
