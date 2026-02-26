'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { PaymentMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, CreditCard, Checkbox } from 'lucide-react'

export default function PaymentSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    payment_type: 'card' as 'card' | 'wallet',
    card_last_four: '',
    card_brand: 'visa' as 'visa' | 'mastercard' | 'amex' | 'rupay',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false
  })

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    try {
      setLoading(true)
      const data = await accountAPI.getPaymentMethods()
      setMethods(data.methods)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      await accountAPI.addPaymentMethod(formData)
      setFormData({
        payment_type: 'card',
        card_last_four: '',
        card_brand: 'visa',
        card_holder_name: '',
        expiry_month: '',
        expiry_year: '',
        is_default: false
      })
      setShowForm(false)
      await loadMethods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMethod = async (id: string) => {
    try {
      setDeleting(id)
      await accountAPI.deletePaymentMethod(id)
      await loadMethods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method')
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      setSaving(true)
      await accountAPI.updatePaymentMethod(id, { is_default: true })
      await loadMethods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method')
    } finally {
      setSaving(false)
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Card'}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="border-t pt-6">
            <form onSubmit={handleAddMethod} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Card Holder Name</label>
                  <Input
                    value={formData.card_holder_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_holder_name: e.target.value }))}
                    placeholder="Enter card holder name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last 4 Digits</label>
                  <Input
                    value={formData.card_last_four}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_last_four: e.target.value }))}
                    placeholder="1234"
                    maxLength="4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Card Brand</label>
                  <select
                    value={formData.card_brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_brand: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="rupay">RuPay</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Month</label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.expiry_month}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_month: e.target.value }))}
                      placeholder="MM"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <Input
                      type="number"
                      min={new Date().getFullYear()}
                      value={formData.expiry_year}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_year: e.target.value }))}
                      placeholder="YYYY"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <span className="text-sm">Set as default payment method</span>
              </label>

              {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Payment Method
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold capitalize">{method.card_brand}</h3>
                    <p className="text-sm text-muted-foreground">•••• {method.card_last_four}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMethod(method.id)}
                  disabled={deleting === method.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p><strong>Holder:</strong> {method.card_holder_name}</p>
                <p><strong>Expires:</strong> {method.expiry_month}/{method.expiry_year}</p>
              </div>
              {!method.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(method.id)}
                  disabled={saving}
                  className="w-full"
                >
                  Set as Default
                </Button>
              )}
              {method.is_default && (
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded text-center">
                  Default Payment Method
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {methods.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No payment methods saved. Click "Add Card" to add one.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
