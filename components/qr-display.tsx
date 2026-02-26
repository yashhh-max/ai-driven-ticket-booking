'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRDisplayProps {
  bookingId: string
  initialQRImage?: string
}

interface QRResponse {
  success: boolean
  message: string
  data?: {
    qrCodeImage: string
    expiresAt: string
  }
  error?: string
}

export function QRDisplay({ bookingId, initialQRImage }: QRDisplayProps) {
  const [qrImage, setQrImage] = useState<string | undefined>(initialQRImage)
  const [isLoading, setIsLoading] = useState(!initialQRImage)
  const [error, setError] = useState<string | undefined>()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 15 // Increased to 15 for 30 seconds total with 2s intervals

  // Auto-refresh QR code if not available initially
  useEffect(() => {
    if (qrImage) return
    if (retryCount >= maxRetries) {
      setError('QR code generation is taking longer than expected. Refresh the page to continue waiting or come back later.')
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        console.log(`[QR Display] Attempt ${retryCount + 1}/${maxRetries} to fetch QR code`)
        
        const response = await fetch(`/api/qr/generate?bookingId=${bookingId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`[QR Display] Fetch response status:`, response.status)

        if (response.ok) {
          try {
            const data: QRResponse = await response.json()
            console.log(`[QR Display] QR data received:`, {
              success: data.success,
              hasImage: !!data.data?.qrCodeImage,
            })
            
            if (data.success && data.data?.qrCodeImage) {
              setQrImage(data.data.qrCodeImage)
              setError(undefined)
              console.log('[QR Display] ✅ QR code loaded successfully')
              return
            } else {
              console.log(`[QR Display] Response OK but no QR image, retrying... Message:`, data.message)
            }
          } catch (parseErr) {
            console.warn('[QR Display] Failed to parse response JSON:', parseErr)
          }
        } else if (response.status === 401) {
          console.warn('[QR Display] Unauthorized - session might have expired')
          setError('Session expired. Please refresh the page.')
          return
        } else if (response.status === 202) {
          console.log('[QR Display] QR code still generating (202 Accepted), will retry...')
          // Continue retrying
        } else if (response.status === 404) {
          console.warn('[QR Display] Booking not found, stopping retries')
          setError('Booking not found. Please go back and verify your booking.')
          return
        } else if (response.status === 400) {
          try {
            const errorData = await response.json()
            console.warn('[QR Display] Invalid request (400):', errorData.error)
            setError(errorData.error || 'Invalid booking status. QR code can only be generated for confirmed bookings.')
            return
          } catch (parseErr) {
            console.warn('[QR Display] HTTP 400 - unable to parse details')
          }
        } else {
          try {
            const errorData = await response.json()
            console.warn(`[QR Display] Fetch failed:`, {
              status: response.status,
              message: errorData.message,
              error: errorData.error,
            })
          } catch (parseErr) {
            console.warn(`[QR Display] HTTP ${response.status} - unable to parse error details`)
          }
        }

        console.log(`[QR Display] Retry attempt ${retryCount + 1}/${maxRetries}`)
        setRetryCount(prev => prev + 1)
      } catch (err) {
        console.error('[QR Display] Error fetching QR code:', err)
        setError(err instanceof Error ? err.message : 'Failed to load QR code')
        setRetryCount(prev => prev + 1)
      } finally {
        setIsLoading(false)
      }
    }, 2000) // Wait 2 seconds before retrying

    return () => clearTimeout(timer)
  }, [bookingId, qrImage, retryCount, maxRetries])

  const handleManualRefresh = async () => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      console.log('[QR Display] Manual refresh triggered')
      const response = await fetch(`/api/qr/generate?bookingId=${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[QR Display] Manual refresh response status:', response.status)
      
      if (response.ok) {
        try {
          const data: QRResponse = await response.json()
          console.log('[QR Display] Manual refresh data received:', {
            success: data.success,
            hasImage: !!data.data?.qrCodeImage,
          })
          
          if (data.success && data.data?.qrCodeImage) {
            setQrImage(data.data.qrCodeImage)
            setRetryCount(0)
            console.log('[QR Display] ✅ QR code refreshed successfully')
          } else {
            setError(data.message || 'QR code not ready yet. Please try again.')
            console.warn('[QR Display] Response OK but no QR image:', data.message)
          }
        } catch (parseErr) {
          console.error('[QR Display] Failed to parse response JSON:', parseErr)
          setError('Invalid response from server. Please try again.')
        }
      } else if (response.status === 401) {
        console.warn('[QR Display] Unauthorized - session expired')
        setError('Session expired. Please refresh the page.')
      } else if (response.status === 404) {
        console.warn('[QR Display] Booking not found')
        setError('Booking not found. Please go back and verify your booking information.')
      } else if (response.status === 400) {
        try {
          const errorData = await response.json()
          setError(errorData.error || 'Invalid booking status.')
          console.error('[QR Display] HTTP 400:', errorData.error)
        } catch (parseErr) {
          setError('Invalid request. Please try again.')
          console.error('[QR Display] HTTP 400 - unable to parse error')
        }
      } else if (response.status === 202) {
        setError('QR code is still being generated. Please try again shortly.')
        console.log('[QR Display] QR code still generating (202 Accepted)')
      } else {
        try {
          const errorData = await response.json()
          const errorMessage = errorData.error || errorData.message || `Server error (${response.status})`
          setError(errorMessage)
          console.error('[QR Display] Manual refresh error:', {
            status: response.status,
            message: errorData.message,
            error: errorData.error,
          })
        } catch (parseErr) {
          console.error(`[QR Display] HTTP ${response.status} error - could not parse error details`)
          setError(`Server error (${response.status}). Please try again.`)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      setError('Error loading QR code. Please check your connection and try again.')
      console.error('[QR Display] Manual refresh exception:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (error && !qrImage) {
    const isEnvError = error.includes('not configured') || error.includes('QR_JWT_SECRET') || error.includes('Missing') || error.includes('Service');
    const isRLSError = error.includes('RLS') || error.includes('policy') || error.includes('row level security');
    
    let helpMessage = '';
    if (isEnvError) {
      helpMessage = 'The system needs environment variables to be configured. Please contact support or check the setup guide.';
    } else if (isRLSError) {
      helpMessage = 'Database access issue. This usually resolves itself when the system is properly configured.';
    }
    
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 h-32 w-32 rounded-lg bg-red-500/10 flex items-center justify-center border-2 border-red-500/30">
          <p className="text-xs text-red-600">⚠️ Error</p>
        </div>
        <p className="text-sm text-red-600 mb-2">{error}</p>
        {helpMessage && (
          <p className="text-xs text-red-500 mb-4 italic">{helpMessage}</p>
        )}
        <Button 
          onClick={handleManualRefresh} 
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (!qrImage) {
    const timeElapsed = Math.ceil((retryCount * 2) / 10) * 10
    const isNearingTimeout = retryCount > maxRetries - 3
    const isHalfway = retryCount > maxRetries / 2
    
    let statusMessage = 'Generating QR Code...';
    let helpText = 'Your QR code is being generated. This typically takes a few seconds.';
    
    if (isNearingTimeout) {
      statusMessage = '📋 Finalizing QR Code...';
      helpText = 'Almost ready! Your QR code will appear any moment now.';
    } else if (isHalfway) {
      statusMessage = '⏳ Creating QR Code...';
      helpText = 'Generation in progress. Hang tight!';
    }
    
    return (
      <div className="p-6 text-center">
        <div className={`mx-auto mb-4 h-32 w-32 rounded-lg flex items-center justify-center border-2 ${isNearingTimeout ? 'border-orange-400 bg-orange-50/30' : 'border-dashed border-border bg-muted/50'}`}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-8 w-8 mb-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce mx-1" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {statusMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Attempt {retryCount + 1}/{maxRetries} ({timeElapsed}s)
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {helpText}
        </p>
        {retryCount > maxRetries / 2 && (
          <p className="text-xs text-orange-600 mb-2">
            💡 Tip: You can refresh the page or close it and open your booking again.
          </p>
        )}
        {retryCount === maxRetries - 1 && (
          <p className="text-xs text-orange-600 mb-2">
            If this takes too long, the system may need configuration. Check the error message after timeout.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 text-center">
      <div className="mx-auto mb-4 h-32 w-32 rounded-lg border-2 border-primary overflow-hidden bg-white shadow-md">
        <img
          src={qrImage}
          alt="Booking QR Code"
          className="w-full h-full object-contain bg-white"
        />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        Booking QR Code
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Scan this code at the cinema entrance
      </p>
      <Button 
        onClick={handleManualRefresh} 
        variant="ghost"
        size="sm"
        className="gap-2"
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  )
}
