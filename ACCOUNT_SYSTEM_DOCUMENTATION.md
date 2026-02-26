# My Account System - Complete Documentation

## Overview
A comprehensive account management system for the AuroSeat movie ticket booking application with 8 major features including profile management, payment methods, loyalty points, promo codes, and more.

## Architecture

### Database Schema
The system uses the following tables in Supabase PostgreSQL:

1. **user_profiles** - Extended user information
2. **user_saved_locations** - Saved cities and theatres
3. **user_wishlist** - Saved movies
4. **user_payment_methods** - Saved payment cards and wallets
5. **user_transactions** - Transaction history
6. **user_refunds** - Refund requests
7. **promo_codes** - Available promotional codes
8. **user_promo_usage** - History of used promo codes
9. **user_loyalty_points** - Loyalty points balance
10. **loyalty_points_history** - Points earning/redemption history
11. **points_redemption** - Points redemption requests
12. **password_change_history** - Password change audit trail

All tables have Row Level Security (RLS) enabled to ensure data isolation between users.

### API Routes

#### Profile Management
- `GET /api/account/profile` - Get user profile
- `PUT /api/account/profile` - Update profile information

#### Saved Locations
- `GET /api/account/locations` - List all saved locations
- `POST /api/account/locations` - Add new location
- `PUT /api/account/locations/[id]` - Update location
- `DELETE /api/account/locations/[id]` - Delete location

#### Wishlist
- `GET /api/account/wishlist` - Get all wishlist items
- `POST /api/account/wishlist` - Add movie to wishlist
- `DELETE /api/account/wishlist/[id]` - Remove from wishlist

#### Payment Methods
- `GET /api/account/payment-methods` - List all payment methods
- `POST /api/account/payment-methods` - Add new payment method
- `PUT /api/account/payment-methods/[id]` - Update payment method
- `DELETE /api/account/payment-methods/[id]` - Delete payment method

#### Transactions
- `GET /api/account/transactions` - Get transaction history (with pagination)
- Query parameters: `limit`, `offset`, `status`

#### Refunds
- `GET /api/account/refunds` - Get refund requests
- `POST /api/account/refunds` - Create refund request

#### Loyalty Points
- `GET /api/account/loyalty-points` - Get loyalty points balance
- `GET /api/account/loyalty-points/history` - Get points history
- `GET /api/account/loyalty-points/redeem` - Get redemption requests
- `POST /api/account/loyalty-points/redeem` - Create redemption request

#### Promo Codes
- `GET /api/account/promo-codes` - Get available promo codes
- `GET /api/account/promo-codes/validate?code=CODE` - Validate promo code
- `GET /api/account/promo-codes/usage` - Get user's promo code usage history

#### Settings
- `POST /api/account/settings/change-password` - Change password
- `DELETE /api/account/settings/delete-account` - Delete account

## Features

### 1. User Profile Management
**File:** `components/account/profile-section.tsx`

**Features:**
- View and edit full name, phone number, bio, date of birth, gender
- Upload and manage profile picture
- Preferred language selection
- Form validation for phone numbers

**API:**
- GET/PUT `/api/account/profile`

### 2. Saved Locations
**File:** `components/account/locations-section.tsx`

**Features:**
- Save multiple locations (home, work, favorite theatre)
- Set default location
- Edit and delete locations
- Supports city, state, and address information

**API:**
- GET/POST/DELETE `/api/account/locations`
- PUT `/api/account/locations/[id]`

### 3. Wishlist / Saved Movies
**File:** `components/account/wishlist-section.tsx`

**Features:**
- Add movies to wishlist
- View all wishlist items with movie details
- Quick links to movie pages
- Remove movies from wishlist

**API:**
- GET/POST/DELETE `/api/account/wishlist`
- DELETE `/api/account/wishlist/[id]`

### 4. Payment Management
**File:** `components/account/payment-section.tsx`

**Features:**
- Add/remove saved credit cards
- Support for Visa, Mastercard, American Express, RuPay
- Set default payment method
- View card expiry and holder details
- Secure card storage (last 4 digits only)

**API:**
- GET/POST `/api/account/payment-methods`
- PUT/DELETE `/api/account/payment-methods/[id]`

### 5. Transaction & Refund History
**File:** `components/account/transactions-section.tsx`

**Features:**
- View all booking transactions
- Track refunds
- See transaction status (pending, completed, failed)
- Request refunds for cancelled bookings

**API:**
- GET `/api/account/transactions`
- GET/POST `/api/account/refunds`

### 6. Offers & Promo Codes
**File:** `components/account/offers-section.tsx`

**Features:**
- Browse available promotional codes
- View discount details (percentage/fixed amount)
- Apply promo codes with validation
- View usage history and applied discounts
- Copy promo codes to clipboard

**API:**
- GET `/api/account/promo-codes`
- GET `/api/account/promo-codes/validate`
- GET `/api/account/promo-codes/usage`

### 7. Loyalty Points / Rewards
**File:** `components/account/loyalty-section.tsx`

**Features:**
- Display total and available points
- View lifetime points earned
- Points earning history
- Redeem points for:
  - Discount coupons
  - Cashback
- Track redemption status
- View points expiration dates

**API:**
- GET `/api/account/loyalty-points`
- GET `/api/account/loyalty-points/history`
- GET/POST `/api/account/loyalty-points/redeem`

### 8. Account Settings
**File:** `components/account/settings-section.tsx`

**Features:**

**Password Management:**
- Change password with current password verification
- Minimum 8 character requirement
- Password change history/audit trail

**Account Deletion:**
- Request account deletion with email confirmation
- Warning about permanent data loss
- Requires user agreement confirmation

**API:**
- POST `/api/account/settings/change-password`
- DELETE `/api/account/settings/delete-account`

## Client-Side Service Layer

**File:** `lib/services/account-api.ts`

Provides a clean abstraction for API calls with consistent error handling:
- All methods include error handling
- Automatic response parsing
- Proper HTTP method usage
- Parameter validation

## File Structure

```
/app
  /account
    page.tsx                    # Main account page with tabs
  /api
    /account
      /profile
        route.ts
      /locations
        [id]/route.ts
      /wishlist
        [id]/route.ts
      /payment-methods
        [id]/route.ts
      /transactions
        route.ts
      /refunds
        route.ts
      /loyalty-points
        /history/route.ts
        /redeem/route.ts
      /promo-codes
        /validate/route.ts
        /usage/route.ts
      /settings
        /change-password/route.ts
        /delete-account/route.ts

/components
  /account
    profile-section.tsx
    locations-section.tsx
    wishlist-section.tsx
    payment-section.tsx
    transactions-section.tsx
    offers-section.tsx
    loyalty-section.tsx
    settings-section.tsx

/lib
  /services
    account-api.ts            # API client service
  /utils
    date-utils.ts             # Date formatting utilities
  types.ts                      # TypeScript interfaces
```

## Security Features

1. **Row Level Security (RLS)** - All data tables use RLS policies
2. **Authentication** - Protected routes require user authentication
3. **Data Isolation** - Users can only access/modify their own data
4. **Password Security** - Passwords handled through Supabase Auth
5. **Email Verification** - Account deletion requires email confirmation
6. **Audit Trail** - Password changes logged with IP and user agent

## TypeScript Types

All types are defined in `lib/types.ts`:
- `UserProfile`
- `SavedLocation`
- `WishlistMovie`
- `PaymentMethod`
- `UserTransaction`
- `RefundRequest`
- `PromoCode`
- `UserPromoUsage`
- `LoyaltyPoints`
- `LoyaltyPointsHistory`
- `PointsRedemption`

## Error Handling

All API routes include:
- Input validation
- Try-catch blocks
- Descriptive error messages
- HTTP status codes
- JSON error responses

## Testing Checklist

- [ ] Create user profile
- [ ] Edit profile information
- [ ] Add/edit/delete saved locations
- [ ] Add/remove movies from wishlist
- [ ] Add/remove payment methods
- [ ] Set default payment method
- [ ] View transaction history
- [ ] Request refund
- [ ] View available promo codes
- [ ] Apply promo codes
- [ ] Check loyalty points balance
- [ ] View points history
- [ ] Redeem points
- [ ] Change password
- [ ] Delete account

## Database Setup

Run the migration script to set up the account system:

```bash
# In your Supabase SQL editor, run:
psql -U postgres -f scripts/020_create_account_system.sql
```

## Environment Variables

No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next Steps

1. Run database migration: `scripts/020_create_account_system.sql`
2. Link the account page in header navigation
3. Add account route to navigation menu
4. Test all features
5. Set up loyalty points earning triggers
6. Configure promo code management interface

## Future Enhancements

1. Avatar upload to cloud storage (Supabase Storage)
2. Email notifications for account activities
3. Two-factor authentication
4. Account activity log
5. Session management
6. Preference/notification settings
7. Social login integration
8. API key management for integrations
