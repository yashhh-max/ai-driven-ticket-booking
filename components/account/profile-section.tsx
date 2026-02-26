'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { Loader2, Camera } from 'lucide-react'

export default function ProfileSection() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    bio: '',
    date_of_birth: '',
    gender: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await accountAPI.getProfile()
      setProfile(data.profile)
      setFormData({
        full_name: data.profile.full_name || '',
        phone_number: data.profile.phone_number || '',
        bio: data.profile.bio || '',
        date_of_birth: data.profile.date_of_birth || '',
        gender: data.profile.gender || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const data = await accountAPI.updateProfile(formData)
      setProfile(data.profile)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-0 right-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <Input
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{success}</div>}

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
