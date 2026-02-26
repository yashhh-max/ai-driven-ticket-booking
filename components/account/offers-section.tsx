'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { PromoCode, UserPromoUsage } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Gift, Copy, Check } from 'lucide-react'
import { formatExpiryDate } from '@/lib/utils/date-utils'

export default function OffersSection() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [usage, setUsage] = useState<UserPromoUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available')

  useEffect(() => {
    loadOffers()
  }, [activeTab])

  const loadOffers = async () => {
    try {
      setLoading(true)
      setError(null)
      if (activeTab === 'available') {
        const data = await accountAPI.getPromoCodes()
        setPromoCodes(data.promoCodes)
      } else {
        const data = await accountAPI.getPromoUsage()
        setUsage(data.usage)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return

    try {
      setValidating(true)
      setError(null)
      await accountAPI.validatePromoCode(promoCode)
      setSuccess(`Promo code ${promoCode} is valid!`)
      setPromoCode('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid promo code')
    } finally {
      setValidating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available Offers</CardTitle>
          <CardDescription>Apply promo codes to get discounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              onKeyPress={(e) => e.key === 'Enter' && handleValidatePromo()}
            />
            <Button onClick={handleValidatePromo} disabled={validating || !promoCode}>
              {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{success}</div>}

          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'available' ? 'default' : 'outline'}
              onClick={() => setActiveTab('available')}
            >
              Available
            </Button>
            <Button
              variant={activeTab === 'used' ? 'default' : 'outline'}
              onClick={() => setActiveTab('used')}
            >
              Used Offers
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'available' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promoCodes.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active promo codes available
              </CardContent>
            </Card>
          ) : (
            promoCodes.map((promo) => (
              <Card key={promo.id} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">
                        <span className="text-2xl text-primary">
                          {promo.discount_value}{promo.discount_type === 'percentage' ? '%' : '₹'}
                        </span>
                        {promo.discount_type === 'percentage' ? ' OFF' : ' Cashback'}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {promo.description && <p>{promo.description}</p>}
                    {promo.min_booking_amount && (
                      <p className="text-muted-foreground">Min. booking: ₹{promo.min_booking_amount}</p>
                    )}
                    {promo.max_discount_amount && (
                      <p className="text-muted-foreground">Max. discount: ₹{promo.max_discount_amount}</p>
                    )}
                    <p className="text-muted-foreground">
                      Valid till: {new Date(promo.valid_until).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCopyCode(promo.code)}
                  >
                    {copied === promo.code ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code: {promo.code}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {usage.length === 0 ? (
              <p className="text-center text-muted-foreground">No promo codes used yet</p>
            ) : (
              <div className="space-y-3">
                {usage.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.promo_code?.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.used_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">-₹{item.discount_applied.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
