'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { SavedLocation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, MapPin } from 'lucide-react'

export default function LocationsSection() {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    location_type: 'home' as 'home' | 'work' | 'favorite_theatre',
    city: '',
    state: '',
    address: '',
    is_default: false
  })

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const data = await accountAPI.getLocations()
      setLocations(data.locations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      await accountAPI.addLocation(formData)
      setFormData({ location_type: 'home', city: '', state: '', address: '', is_default: false })
      setShowForm(false)
      await loadLocations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLocation = async (id: string) => {
    try {
      setDeleting(id)
      await accountAPI.deleteLocation(id)
      await loadLocations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location')
    } finally {
      setDeleting(null)
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
              <CardTitle>Saved Locations</CardTitle>
              <CardDescription>Manage your preferred cities and theatres</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Location'}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="border-t pt-6">
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="favorite_theatre">Favorite Theatre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <span className="text-sm">Set as default location</span>
              </label>

              {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Location
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold capitalize">{location.location_type}</h3>
                  {location.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLocation(location.id)}
                  disabled={deleting === location.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <p><strong>City:</strong> {location.city}</p>
                {location.state && <p><strong>State:</strong> {location.state}</p>}
                {location.address && <p><strong>Address:</strong> {location.address}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locations.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No saved locations yet. Click "Add Location" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
