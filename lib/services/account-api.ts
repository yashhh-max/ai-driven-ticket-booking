import { UserProfile, SavedLocation, WishlistMovie, PaymentMethod, UserTransaction, RefundRequest, PromoCode, UserPromoUsage, LoyaltyPoints, LoyaltyPointsHistory, PointsRedemption } from '@/lib/types'

const API_BASE = '/api/account'

export const accountAPI = {
  // Profile
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/profile`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch profile')
    return res.json()
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update profile')
    return res.json()
  },

  // Saved Locations
  getLocations: async () => {
    const res = await fetch(`${API_BASE}/locations`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch locations')
    return res.json()
  },

  addLocation: async (data: Omit<SavedLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to add location')
    return res.json()
  },

  updateLocation: async (id: string, data: Partial<SavedLocation>) => {
    const res = await fetch(`${API_BASE}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update location')
    return res.json()
  },

  deleteLocation: async (id: string) => {
    const res = await fetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete location')
    return res.json()
  },

  // Wishlist
  getWishlist: async () => {
    const res = await fetch(`${API_BASE}/wishlist`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch wishlist')
    return res.json()
  },

  addToWishlist: async (movie_id: string) => {
    const res = await fetch(`${API_BASE}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id })
    })
    if (!res.ok) throw new Error('Failed to add to wishlist')
    return res.json()
  },

  removeFromWishlist: async (id: string) => {
    const res = await fetch(`${API_BASE}/wishlist/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to remove from wishlist')
    return res.json()
  },

  // Payment Methods
  getPaymentMethods: async () => {
    const res = await fetch(`${API_BASE}/payment-methods`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch payment methods')
    return res.json()
  },

  addPaymentMethod: async (data: Omit<PaymentMethod, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch(`${API_BASE}/payment-methods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to add payment method')
    return res.json()
  },

  deletePaymentMethod: async (id: string) => {
    const res = await fetch(`${API_BASE}/payment-methods/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete payment method')
    return res.json()
  },

  updatePaymentMethod: async (id: string, data: Partial<PaymentMethod>) => {
    const res = await fetch(`${API_BASE}/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update payment method')
    return res.json()
  },

  // Transactions
  getTransactions: async (limit = 20, offset = 0, status?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.append('status', status)
    const res = await fetch(`${API_BASE}/transactions?${params}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch transactions')
    return res.json()
  },

  // Refunds
  getRefunds: async () => {
    const res = await fetch(`${API_BASE}/refunds`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch refunds')
    return res.json()
  },

  requestRefund: async (booking_id: string, reason: string, refund_amount?: number) => {
    const res = await fetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id, reason, refund_amount })
    })
    if (!res.ok) throw new Error('Failed to request refund')
    return res.json()
  },

  // Loyalty Points
  getLoyaltyPoints: async () => {
    const res = await fetch(`${API_BASE}/loyalty-points`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch loyalty points')
    return res.json()
  },

  getPointsHistory: async () => {
    const res = await fetch(`${API_BASE}/loyalty-points/history`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch points history')
    return res.json()
  },

  redeemPoints: async (points_amount: number, redemption_type: 'discount_coupon' | 'cashback') => {
    const res = await fetch(`${API_BASE}/loyalty-points/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points_amount, redemption_type })
    })
    if (!res.ok) throw new Error('Failed to redeem points')
    return res.json()
  },

  getRedemptions: async () => {
    const res = await fetch(`${API_BASE}/loyalty-points/redeem`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch redemptions')
    return res.json()
  },

  // Promo Codes
  getPromoCodes: async () => {
    const res = await fetch(`${API_BASE}/promo-codes`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch promo codes')
    return res.json()
  },

  validatePromoCode: async (code: string) => {
    const res = await fetch(`${API_BASE}/promo-codes/validate?code=${encodeURIComponent(code)}`)
    if (!res.ok) throw new Error('Invalid promo code')
    return res.json()
  },

  getPromoUsage: async () => {
    const res = await fetch(`${API_BASE}/promo-codes/usage`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch promo usage')
    return res.json()
  },

  // Settings
  changePassword: async (current_password: string, new_password: string) => {
    const res = await fetch(`${API_BASE}/settings/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password, new_password })
    })
    if (!res.ok) throw new Error('Failed to change password')
    return res.json()
  },

  deleteAccount: async (confirm_email: string) => {
    const res = await fetch(`${API_BASE}/settings/delete-account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_email })
    })
    if (!res.ok) throw new Error('Failed to delete account')
    return res.json()
  }
}
