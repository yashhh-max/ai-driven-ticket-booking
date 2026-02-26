export interface Movie {
  id: string
  title: string
  description: string
  duration_minutes: number
  genre: string
  rating: string
  poster_url: string
  release_date: string
  created_at: string
  has_prebooking?: boolean
}

export interface Theater {
  id: string
  name: string
  total_rows: number
  seats_per_row: number
  location: string
  created_at: string
}

export interface Showtime {
  id: string
  movie_id: string
  theater_id: string
  show_date: string
  show_time: string
  price: number
  is_active: boolean
  created_at: string
  movie?: Movie
  theater?: Theater
}

export interface Seat {
  id: string
  theater_id: string
  row_label: string
  seat_number: number
  seat_type: 'standard' | 'premium' | 'vip'
  created_at: string
}

export interface SeatWithStatus extends Seat {
  status: 'available' | 'selected' | 'booked' | 'locked'
}

export interface Booking {
  id: string
  user_id: string
  showtime_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  showtime?: Showtime
  seats?: BookedSeat[]
}

export interface BookedSeat {
  id: string
  booking_id: string
  seat_id: string
  price: number
  created_at: string
  seat?: Seat
}

export interface SeatLock {
  id: string
  seat_id: string
  showtime_id: string
  user_id: string
  expires_at: string
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: 'credit' | 'deduction' | 'refund'
  amount: number
  description: string
  booking_id?: string
  created_at: string
}

export interface PreBooking {
  id: string
  user_id: string
  showtime_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: number
  total_amount: number
}

// Advanced Features Types
export interface RecurringBooking {
  id: string
  user_id: string
  movie_id: string
  theater_id: string
  day_of_week: number // 0-6
  show_time: string
  start_date: string
  end_date: string | null
  is_active: boolean
  auto_book: boolean
  created_at: string
  updated_at: string
}

export interface WaitlistEntry {
  id: string
  user_id: string
  showtime_id: string
  position: number
  status: 'waiting' | 'notified' | 'booked' | 'cancelled'
  created_at: string
  notified_at: string | null
}

export interface PartialBooking {
  id: string
  user_id: string
  showtime_id: string
  selected_seat_ids: string[]
  total_amount: number
  created_at: string
  updated_at: string
  expires_at: string
}

export interface BookingModification {
  id: string
  booking_id: string
  old_show_date: string | null
  new_show_date: string | null
  old_show_time: string | null
  new_show_time: string | null
  old_seats: string[] | null
  new_seats: string[] | null
  modification_type: 'date' | 'time' | 'seats' | 'combined' | 'other'
  reason: string | null
  created_at: string
}

export interface DynamicPricing {
  id: string
  showtime_id: string
  base_price: number
  current_price: number
  occupancy_percentage: number
  time_until_show_minutes: number
  price_multiplier: number
  updated_at: string
}
  failure_reason?: string
  processed_at?: string
  booking_id?: string
  created_at: string
  updated_at: string
  showtime?: Showtime & { ticket_release_time?: string }
  pre_booked_seats?: PreBookedSeat[]
}

export interface PreBookedSeat {
  id: string
  pre_booking_id: string
  seat_id: string
  price: number
  created_at: string
  seat?: Seat
}

export interface ShowtimeWithRelease extends Showtime {
  ticket_release_time?: string
}
export interface Notification {
  id: string
  user_id: string
  type: 'auto_booking' | 'ticket_release' | 'price_alert' | 'booking_confirmed'
  title: string
  message: string
  related_booking_id?: string
  related_pre_booking_id?: string
  related_movie_id?: string
  is_read: boolean
  delivery_methods: ('in_app' | 'push' | 'email')[]
  delivery_status?: Record<string, string>
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  auto_booking_enabled: boolean
  auto_booking_method: ('in_app' | 'push' | 'email')[]
  ticket_release_enabled: boolean
  ticket_release_method: ('in_app' | 'push' | 'email')[]
  price_alert_enabled: boolean
  price_alert_method: ('in_app' | 'push' | 'email')[]
  booking_updates_enabled: boolean
  booking_updates_method: ('in_app' | 'push' | 'email')[]
  push_enabled: boolean
  email_enabled: boolean
  created_at: string
  updated_at: string
}

// Account/Profile Types
export interface UserProfile {
  id: string
  full_name?: string
  phone_number?: string
  profile_picture_url?: string
  bio?: string
  date_of_birth?: string
  gender?: string
  preferred_language: string
  updated_at: string
}

export interface SavedLocation {
  id: string
  user_id: string
  location_type: 'home' | 'work' | 'favorite_theatre'
  city: string
  state?: string
  address?: string
  theatre_id?: string
  is_default: boolean
  created_at: string
  updated_at: string
  theatre?: Theater
}

export interface WishlistMovie {
  id: string
  user_id: string
  movie_id: string
  added_at: string
  movie?: Movie
}

export interface PaymentMethod {
  id: string
  user_id: string
  payment_type: 'card' | 'wallet'
  card_last_four?: string
  card_brand?: 'visa' | 'mastercard' | 'amex' | 'rupay'
  card_holder_name?: string
  expiry_month?: number
  expiry_year?: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserTransaction {
  id: string
  user_id: string
  booking_id?: string
  transaction_type: 'booking' | 'refund' | 'wallet_topup'
  amount: number
  currency: string
  payment_method_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id?: string
  description?: string
  created_at: string
  updated_at: string
  booking?: Booking
  payment_method?: PaymentMethod
}

export interface RefundRequest {
  id: string
  user_id: string
  booking_id: string
  transaction_id?: string
  refund_amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  rejection_reason?: string
  requested_at: string
  processed_at?: string
  updated_at: string
  booking?: Booking
}

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_amount?: number
  min_booking_amount?: number
  usage_limit?: number
  usage_count: number
  valid_from: string
  valid_until: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface UserPromoUsage {
  id: string
  user_id: string
  promo_code_id: string
  booking_id: string
  discount_applied: number
  used_at: string
  promo_code?: PromoCode
}

export interface LoyaltyPoints {
  id: string
  user_id: string
  total_points: number
  available_points: number
  redeemed_points: number
  lifetime_points: number
  created_at: string
  updated_at: string
}

export interface LoyaltyPointsHistory {
  id: string
  user_id: string
  points_type: 'earned' | 'redeemed' | 'expired'
  points_amount: number
  booking_id?: string
  transaction_id?: string
  description?: string
  expires_at?: string
  created_at: string
}

export interface PointsRedemption {
  id: string
  user_id: string
  points_amount: number
  redemption_type: 'discount_coupon' | 'cashback'
  status: 'pending' | 'approved' | 'completed' | 'failed'
  equivalent_amount?: number
  coupon_code?: string
  redeemed_at?: string
  created_at: string
}

// QR Code Types
export interface BookingQRCode {
  id: string
  booking_id: string
  user_id: string
  qr_token: string // JWT token containing booking info
  qr_code_image: string // Base64 encoded PNG or data URL
  qr_generated_at: string // ISO timestamp
  qr_expires_at: string // ISO timestamp (4 hours after generation)
  qr_used: boolean
  qr_scanned_at: string | null // ISO timestamp when scanned
  qr_scanned_by: string | null // Staff member ID
  created_at: string
  updated_at: string
}

export interface QRScanLog {
  id: string
  booking_id: string
  user_id: string
  scanned_at: string // ISO timestamp
  scanned_by: string | null // Staff member ID
  status: 'success' | 'failed' | 'already_used' | 'invalid_token'
  error_message: string | null
  device_info: Record<string, any> | null
  created_at: string
}

export interface QRPayload {
  bookingId: string
  userId: string
  theatreId: string
  showDate: string
  showTime: string
  seats: string[]
  iat?: number // Issued at
  exp?: number // Expiration time
}

export interface GenerateQRRequest {
  bookingId: string
}

export interface GenerateQRResponse {
  success: boolean
  message: string
  data?: {
    bookingId: string
    qrToken: string
    qrCodeImage: string // Base64 PNG with data URL
    expiresAt: string
    expiresInHours: number
  }
  error?: string
}

export interface VerifyQRRequest {
  qrToken: string
  staffId?: string
}

export interface VerifyQRResponse {
  success: boolean
  message: string
  bookingDetails?: {
    bookingId: string
    userId: string
    status: string
    movieTitle?: string
    theatreName?: string
    showDate: string
    showTime: string
    seats: string[]
    totalAmount: number
  }
  error?: string
}