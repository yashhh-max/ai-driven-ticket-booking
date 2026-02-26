'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { LoyaltyPoints, LoyaltyPointsHistory, PointsRedemption } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Award, TrendingUp } from 'lucide-react'

export default function LoyaltySection() {
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null)
  const [history, setHistory] = useState<LoyaltyPointsHistory[]>([])
  const [redemptions, setRedemptions] = useState<PointsRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemType, setRedeemType] = useState<'discount_coupon' | 'cashback'>('discount_coupon')
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'redemptions'>('overview')

  useEffect(() => {
    loadLoyalty()
  }, [activeTab])

  const loadLoyalty = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'overview') {
        const data = await accountAPI.getLoyaltyPoints()
        setLoyalty(data.loyalty)
      } else if (activeTab === 'history') {
        const data = await accountAPI.getPointsHistory()
        setHistory(data.history)
      } else {
        const data = await accountAPI.getRedemptions()
        setRedemptions(data.redemptions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!redeemAmount || isNaN(parseInt(redeemAmount))) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setRedeeming(true)
      setError(null)
      await accountAPI.redeemPoints(parseInt(redeemAmount), redeemType)
      setSuccess(`${redeemAmount} points redeemed successfully!`)
      setRedeemAmount('')
      setTimeout(() => setSuccess(null), 3000)
      await loadLoyalty()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem points')
    } finally {
      setRedeeming(false)
    }
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
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          History
        </Button>
        <Button
          variant={activeTab === 'redemptions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('redemptions')}
        >
          Redemptions
        </Button>
      </div>

      {activeTab === 'overview' && loyalty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                  <p className="text-3xl font-bold mt-2">{loyalty.available_points}</p>
                </div>
                <Award className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Points</p>
                  <p className="text-3xl font-bold mt-2">{loyalty.lifetime_points}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Redeem Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Points to Redeem</label>
                  <Input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    max={loyalty.available_points}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Redemption Type</label>
                  <select
                    value={redeemType}
                    onChange={(e) => setRedeemType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="discount_coupon">Discount Coupon</option>
                    <option value="cashback">Cashback</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleRedeem} disabled={redeeming || !redeemAmount} className="w-full">
                    {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Redeem
                  </Button>
                </div>
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
              {success && <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{success}</div>}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Points History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No points history yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium capitalize">{item.points_type}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`font-semibold ${item.points_type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.points_type === 'earned' ? '+' : '-'}{item.points_amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'redemptions' && (
        <Card>
          <CardHeader>
            <CardTitle>Redemption Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {redemptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No redemption requests yet</p>
            ) : (
              <div className="space-y-3">
                {redemptions.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.points_amount} points</p>
                        <p className="text-sm text-muted-foreground capitalize">Type: {item.redemption_type}</p>
                        {item.equivalent_amount && (
                          <p className="text-sm mt-1">Equivalent: ₹{item.equivalent_amount.toFixed(2)}</p>
                        )}
                        {item.coupon_code && (
                          <p className="text-sm mt-1">Coupon: <strong>{item.coupon_code}</strong></p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        item.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        item.status === 'approved' ? 'bg-blue-500/10 text-blue-600' :
                        item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
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
