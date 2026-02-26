/**
 * React Hook for QR Code Operations
 * Provides easy-to-use interface for generating and retrieving QR codes
 */

'use client'

import { useState, useCallback } from 'react';

interface GenerateQRResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    qrToken: string;
    qrCodeImage: string;
    expiresAt: string;
    expiresInHours: number;
  };
  error?: string;
}

interface GetQRResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    qrToken: string;
    qrCodeImage: string;
    expiresAt: string;
    isUsed: boolean;
    scannedAt: string | null;
    generatedAt: string;
  };
  error?: string;
}

interface UseQRCodeReturn {
  generateQR: (bookingId: string) => Promise<GenerateQRResponse>;
  getQR: (bookingId: string) => Promise<GetQRResponse>;
  loading: boolean;
  error: string | null;
  progress: number;
}

/**
 * Hook for QR code operations
 * Usage:
 * const { generateQR, getQR, loading, error } = useQRCode();
 * 
 * // Generate QR code after booking confirmation
 * const result = await generateQR(bookingId);
 * 
 * // Or retrieve existing QR code
 * const existing = await getQR(bookingId);
 */
export function useQRCode(): UseQRCodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateQR = useCallback(
    async (bookingId: string): Promise<GenerateQRResponse> => {
      try {
        setLoading(true);
        setError(null);
        setProgress(10);

        if (!bookingId) {
          throw new Error('Booking ID is required');
        }

        setProgress(30);

        const response = await fetch('/api/qr/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        });

        setProgress(70);

        const data: GenerateQRResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate QR code');
        }

        setProgress(100);
        setLoading(false);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: 'Error',
          error: errorMessage,
        };
      }
    },
    []
  );

  const getQR = useCallback(
    async (bookingId: string): Promise<GetQRResponse> => {
      try {
        setLoading(true);
        setError(null);
        setProgress(10);

        if (!bookingId) {
          throw new Error('Booking ID is required');
        }

        setProgress(30);

        const response = await fetch(`/api/qr/generate?bookingId=${encodeURIComponent(bookingId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        setProgress(70);

        const data: GetQRResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to retrieve QR code');
        }

        setProgress(100);
        setLoading(false);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: 'Error',
          error: errorMessage,
        };
      }
    },
    []
  );

  return {
    generateQR,
    getQR,
    loading,
    error,
    progress,
  };
}

/**
 * Hook for QR verification (used by staff/theatre)
 */
export function useQRVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyQR = useCallback(
    async (qrToken: string, staffId?: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!qrToken) {
          throw new Error('QR token is required');
        }

        const response = await fetch('/api/qr/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrToken, staffId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setLoading(false);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: 'Error',
          error: errorMessage,
        };
      }
    },
    []
  );

  const decodeQRPreview = useCallback(
    async (qrToken: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/qr/verify?token=${encodeURIComponent(qrToken)}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to decode QR');
        }

        setLoading(false);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: 'Error',
          error: errorMessage,
        };
      }
    },
    []
  );

  return {
    verifyQR,
    decodeQRPreview,
    loading,
    error,
  };
}
