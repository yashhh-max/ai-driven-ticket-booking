'use client'

import { useState } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'password' | 'delete'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Account deletion state
  const [deleteConfirm, setDeleteConfirm] = useState({
    confirm_email: '',
    agree_checkbox: false
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      await accountAPI.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      )
      setSuccess('Password changed successfully')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!deleteConfirm.agree_checkbox) {
      setError('Please agree to the terms to delete your account')
      return
    }

    if (!deleteConfirm.confirm_email) {
      setError('Please enter your email address')
      return
    }

    try {
      setLoading(true)
      await accountAPI.deleteAccount(deleteConfirm.confirm_email)
      setSuccess('Your account has been deleted')
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'password' ? 'default' : 'outline'}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </Button>
        <Button
          variant={activeTab === 'delete' ? 'default' : 'outline'}
          onClick={() => setActiveTab('delete')}
        >
          Delete Account
        </Button>
      </div>

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Enter new password (min. 8 characters)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
              {success && <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{success}</div>}

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'delete' && (
        <Card className="border-destructive/50">
          <CardHeader className="bg-destructive/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-6">
              Deleting your account will permanently remove all your data including bookings, wishlist, loyalty points, and other information. This action cannot be reversed.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Confirm your email address</label>
                <Input
                  type="email"
                  value={deleteConfirm.confirm_email}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, confirm_email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={deleteConfirm.agree_checkbox}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, agree_checkbox: e.target.checked }))}
                  className="mt-1"
                  required
                />
                <span className="text-sm">
                  I understand that deleting my account will permanently remove all my data and this action cannot be undone. I want to delete my account.
                </span>
              </label>

              {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
              {success && <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{success}</div>}

              <Button
                type="submit"
                variant="destructive"
                disabled={loading || !deleteConfirm.agree_checkbox || !deleteConfirm.confirm_email}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete My Account
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
