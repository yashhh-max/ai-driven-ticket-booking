'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Theater } from '@/lib/types'

interface TheatrePreference {
  id: string
  user_id: string
  theatre_id: string
  priority: number
  theater: Theater
}

export default function TheatrePreferencesPage() {
  const [theatres, setTheatres] = useState<Theater[]>([])
  const [preferences, setPreferences] = useState<TheatrePreference[]>([])
  const [selectedTheatres, setSelectedTheatres] = useState<{ [key: string]: number | null }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load all theatres
      const { data: theatresData, error: theatresError } = await supabase
        .from('theaters')
        .select('*')
        .order('name', { ascending: true })

      if (!theatresError && theatresData) {
        setTheatres(theatresData as Theater[])
      }

      // Load user's existing preferences
      const { data: preferencesData } = await supabase
        .from('user_theatre_preferences')
        .select(`
          *,
          theater:theaters(*)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: true })

      if (preferencesData) {
        setPreferences(preferencesData as TheatrePreference[])
        
        // Build selected theatres map
        const selected: { [key: string]: number | null } = {}
        preferencesData.forEach((pref: TheatrePreference) => {
          selected[pref.theatre_id] = pref.priority
        })
        setSelectedTheatres(selected)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleTheatreToggle = (theatreId: string, isChecked: boolean) => {
    if (isChecked) {
      // Find next available priority
      const usedPriorities = Object.values(selectedTheatres).filter((p) => p !== null)
      const nextPriority = Math.max(...usedPriorities, 0) + 1

      if (nextPriority > 3) {
        toast({
          title: 'Maximum Theatres',
          description: 'You can select up to 3 theatres',
          variant: 'destructive',
        })
        return
      }

      setSelectedTheatres((prev) => ({
        ...prev,
        [theatreId]: nextPriority,
      }))
    } else {
      const removedPriority = selectedTheatres[theatreId]
      
      const newSelected = { ...selectedTheatres }
      delete newSelected[theatreId]

      // Reassign priorities to remaining theatres
      const entries = Object.entries(newSelected)
        .sort(([, p1], [, p2]) => (p1 ?? 0) - (p2 ?? 0))
        .map(([id, _], index) => [id, index + 1] as const)

      setSelectedTheatres(
        entries.reduce((acc, [id, priority]) => ({ ...acc, [id]: priority }), {})
      )
    }
  }

  const handleMovePriority = (theatreId: string, direction: 'up' | 'down') => {
    const currentPriority = selectedTheatres[theatreId]
    if (!currentPriority) return

    const newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1
    if (newPriority < 1 || newPriority > 3) return

    // Find theatre with target priority
    const targetTheatre = Object.entries(selectedTheatres).find(
      ([, p]) => p === newPriority
    )?.[0]

    if (targetTheatre) {
      setSelectedTheatres((prev) => ({
        ...prev,
        [theatreId]: newPriority,
        [targetTheatre]: currentPriority,
      }))
    }
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)

    try {
      console.log('Starting preference save for user:', user.id)

      // First, check if table exists and user can access it
      const { data: checkData, error: checkError } = await supabase
        .from('user_theatre_preferences')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (checkError) {
        console.error('Check error:', checkError)
        throw new Error(`Cannot access preferences table: ${checkError.message}`)
      }

      console.log('Table access OK, existing preferences:', checkData)

      // Delete existing preferences
      const { data: deleteData, error: deleteError, status: deleteStatus } = await supabase
        .from('user_theatre_preferences')
        .delete()
        .eq('user_id', user.id)

      console.log('Delete response:', { deleteStatus, deleteData, deleteError })

      if (deleteError && Object.keys(deleteError).length > 0) {
        console.error('Delete error details:', deleteError)
        throw new Error(deleteError.message || JSON.stringify(deleteError) || 'Failed to delete existing preferences')
      }

      // Insert new preferences
      const preferencesToInsert = Object.entries(selectedTheatres)
        .filter(([, priority]) => priority !== null)
        .map(([theatreId, priority]) => ({
          user_id: user.id,
          theatre_id: theatreId,
          priority,
        }))

      console.log('Preferences to insert:', preferencesToInsert)

      if (preferencesToInsert.length > 0) {
        const { error: insertError, data: insertData, status: insertStatus } = await supabase
          .from('user_theatre_preferences')
          .insert(preferencesToInsert)

        console.log('Insert response:', { insertStatus, insertData, insertError })

        if (insertError && Object.keys(insertError).length > 0) {
          console.error('Insert error details:', insertError)
          throw new Error(insertError.message || JSON.stringify(insertError) || 'Failed to save preferences')
        }
      }

      toast({
        title: 'Success',
        description: 'Your theatre preferences have been updated',
        variant: 'default',
      })

      router.push('/auto-book')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error saving preferences:', errorMessage, error)
      toast({
        title: 'Error',
        description: errorMessage || 'Failed to save preferences',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedCount = Object.values(selectedTheatres).filter((p) => p !== null).length
  const sortedSelected = Object.entries(selectedTheatres)
    .filter(([, p]) => p !== null)
    .sort(([, p1], [, p2]) => (p1 ?? 0) - (p2 ?? 0))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/auto-book" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Auto-Book
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Theatre Preferences</h1>
          <p className="mt-2 text-muted-foreground">
            Select up to 3 theatres in priority order for auto-booking fallback
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Available Theatres */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Theatres</CardTitle>
                <CardDescription>
                  Select theatres to add to your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {theatres.map((theatre) => (
                    <label
                      key={theatre.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50 transition"
                    >
                      <Checkbox
                        checked={selectedTheatres[theatre.id] !== undefined}
                        onCheckedChange={(checked) =>
                          handleTheatreToggle(theatre.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{theatre.name}</p>
                        {theatre.location && (
                          <p className="text-sm text-muted-foreground">{theatre.location}</p>
                        )}
                      </div>
                      {selectedTheatres[theatre.id] !== undefined && (
                        <Badge className="bg-primary text-white">
                          #{selectedTheatres[theatre.id]}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Selected Theatres */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selected Theatres</CardTitle>
                <CardDescription>
                  {selectedCount}/3 selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No theatres selected yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedSelected.map(([theatreId, priority], index) => {
                      const theatre = theatres.find((t) => t.id === theatreId)
                      return (
                        <div
                          key={theatreId}
                          className="flex items-center gap-2 rounded-lg bg-primary/10 p-3"
                        >
                          <Badge className="bg-primary text-white min-w-fit">
                            {priority}
                          </Badge>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">
                            {theatre?.name}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={index === 0}
                              onClick={() => handleMovePriority(theatreId, 'up')}
                            >
                              ↑
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={index === selectedCount - 1}
                              onClick={() => handleMovePriority(theatreId, 'down')}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 border-blue-200/50 bg-blue-50/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-950">
                    <p className="font-semibold mb-1">How it works</p>
                    <p>
                      When you auto-book, the system tries theatres in this priority order.
                      If the first choice is full, it automatically tries the next one.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/auto-book">Cancel</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            className="gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </main>
    </div>
  )
}
