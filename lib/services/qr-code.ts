/**
 * QR Code Generation and Management Service
 * Handles JWT-based secure QR token generation, encryption, and verification
 */

import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

interface QRPayload {
  bookingId: string;
  userId: string;
  theatreId: string;
  showDate: string;
  showTime: string;
  seats: string[];
  iat?: number;
  exp?: number;
}

interface QRGenerationResult {
  token: string;
  qrDataUrl: string; // Base64 encoded QR code image
  expiresAt: string;
  expiresIn: number; // milliseconds
}

interface QRVerificationResult {
  valid: boolean;
  payload?: QRPayload;
  error?: string;
}

/**
 * Generate a secure JWT token for the booking
 * Token expires after 4 hours
 */
export function generateQRToken(payload: Omit<QRPayload, 'iat' | 'exp'>): string {
  const secret = process.env.QR_JWT_SECRET;
  
  if (!secret) {
    console.error('[QR Token] QR_JWT_SECRET is not configured')
    console.error('[QR Token] Please add QR_JWT_SECRET to your .env.local file')
    console.error('[QR Token] Example: QR_JWT_SECRET=your-32-character-random-secret-key')
    throw new Error('QR_JWT_SECRET environment variable is not configured. Check your .env.local file.');
  }

  if (secret.length < 32) {
    console.warn('[QR Token] QR_JWT_SECRET should be at least 32 characters long for security')
  }

  try {
    // Token expires in 4 hours
    const token = jwt.sign(payload, secret, {
      expiresIn: '4h',
      algorithm: 'HS256',
    });
    console.log('[QR Token] ✅ Token generated successfully')
    return token;
  } catch (error) {
    console.error('[QR Token] Failed to sign token:', error)
    throw error
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyQRToken(token: string): QRVerificationResult {
  const secret = process.env.QR_JWT_SECRET;

  if (!secret) {
    return {
      valid: false,
      error: 'QR verification not configured',
    };
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as QRPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
    
    return {
      valid: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate QR code image as data URL
 */
export async function generateQRImage(token: string): Promise<string> {
  try {
    // Higher error correction level (H) for better scan reliability
    const qrDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300, // Optimized size for ticket scanning
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate complete QR code (token + image) for a booking
 * This should be called AFTER booking is confirmed and saved
 */
export async function generateBookingQRCode(
  bookingId: string,
  userId: string,
  theatreId: string,
  showDate: string,
  showTime: string,
  seats: string[]
): Promise<QRGenerationResult> {
  try {
    // Create JWT token payload
    const payload: Omit<QRPayload, 'iat' | 'exp'> = {
      bookingId,
      userId,
      theatreId,
      showDate,
      showTime,
      seats,
    };

    // Generate JWT token
    const token = generateQRToken(payload);

    // Generate QR code image
    const qrDataUrl = await generateQRImage(token);

    // Calculate expiration time
    const now = Date.now();
    const expiresInMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    const expiresAt = new Date(now + expiresInMs).toISOString();

    return {
      token,
      qrDataUrl,
      expiresAt,
      expiresIn: expiresInMs,
    };
  } catch (error) {
    throw new Error(
      `QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract booking details from QR token without verification
 * Useful for displaying info before verification
 */
export function decodeQRTokenWithoutVerification(token: string): QRPayload | null {
  try {
    const decoded = jwt.decode(token) as QRPayload | null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Get time remaining until token expiration
 * Returns null if token is expired or invalid
 */
export function getTokenTimeRemaining(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      return null;
    }

    const expiresAtMs = decoded.exp * 1000;
    const nowMs = Date.now();
    const remainingMs = expiresAtMs - nowMs;

    return remainingMs > 0 ? remainingMs : null;
  } catch {
    return null;
  }
}
