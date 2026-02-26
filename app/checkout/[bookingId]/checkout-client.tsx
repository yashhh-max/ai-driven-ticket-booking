'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CreditCard, Loader2, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Showtime, Theater, BookedSeat, Seat } from '@/lib/types'

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
  const supabase = createClient()

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

    setIsProcessing(true)

    try {
      // Simulate payment processing (in production, integrate with Stripe/payment provider)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
        })
        .eq('id', booking.id)

      if (updateError) {
        console.error('Booking update error:', updateError)
        throw new Error(updateError.message || 'Failed to update booking')
      }

      // Clear any remaining seat locks
      const { error: lockError } = await supabase
        .from('seat_locks')
        .delete()
        .eq('showtime_id', booking.showtime_id)
        .eq('user_id', booking.user_id)

      if (lockError) {
        console.error('Seat lock deletion error:', lockError)
        // Don't throw here as locks deletion failure shouldn't block payment confirmation
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

          console.log('[QR] Generate-QR Response Status:', qrResponse.status)

          if (qrResponse.ok) {
            const qrData = await qrResponse.json()
            if (qrData.success) {
              console.log('[QR] ✅ QR code generated successfully')
              toast.success('QR code generated!')
            } else {
              console.log('[QR] QR generation returned non-success response:', qrData.message)
            }
          } else {
            console.warn('[QR] QR generation failed with status:', qrResponse.status)
            const errorData = await qrResponse.json()
            console.warn('[QR] Error details:', errorData.error)
          }
        } catch (qrError) {
          console.error('[QR] QR generation exception:', qrError)
          // Don't fail the payment if QR generation fails
        }
      }

      toast.success('Payment successful!')
      router.push(`/confirmation/${booking.id}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Payment error:', errorMessage)
      toast.error(`Payment failed: ${errorMessage}`)
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
              `Pay ${formatCurrency(booking.total_amount + 69)}`
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
