# QR Code Generation - Root Cause Analysis & Fixes

## Root Cause: QR Timeout Issue

The QR code was timing out because it was **never being generated in the first place**. Here's why:

### The Problem Flow
1. User completes payment → Checkout form updates booking to `confirmed`
2. Checkout form tries to call `/api/qr/generate` to generate QR
3. **BUT** `/api/qr/generate` POST endpoint is designed for payment verification flow (called from Razorpay)
4. It expects booking data to come from a payment verification call, not directly
5. Result: QR never generated, confirmation page times out waiting for it

## Issues Identified and Fixed

### 1. **Column Name Mismatch** ✅ FIXED
**File**: `app/api/payments/route.ts`
**Problem**: Payment verification was updating a non-existent column `booking_status` instead of `status`
**Impact**: If Razorpay is used, bookings would never be marked as confirmed
**Fix**: Changed to use correct column name `status`

### 2. **Missing Seat Details** ✅ FIXED  
**File**: `app/api/payments/route.ts`
**Problem**: Booking query only fetched `seat_id` but not seat details (row_label, seat_number)
**Impact**: QR generation would receive UUID seat IDs instead of formatted seat strings like "A1", "B5"
**Fix**: Updated query to include nested `seat:seats(row_label, seat_number)` for proper seat formatting

### 3. **Invalid Database Updates** ✅ FIXED
**File**: `lib/services/qr-database.ts`
**Problem**: Code was trying to update non-existent columns (`has_qr_code`, `updated_at`) on bookings table
**Impact**: Potential database errors, unnecessary operations
**Fix**: Removed unnecessary booking table update since QR is tracked in booking_qr_codes table

### 4. **Missing QR Generation Endpoint for Checkout** ✅ CREATED
**File**: `app/api/bookings/[id]/generate-qr/route.ts` (NEW)
**Problem**: No direct endpoint to generate QR from checkout form
**Impact**: Checkout flow couldn't generate QR codes with the new booking status
**Fix**: Created dedicated POST endpoint that:
   - Verifies booking is confirmed
   - Has access to full booking details
   - Generates and saves QR code
   - Returns complete QR data with image

### 5. **Updated Checkout Form** ✅ FIXED
**File**: `app/checkout/[bookingId]/checkout-client.tsx`
**Problem**: Was calling wrong endpoint and had overly complex retry logic
**Impact**: QR generation was unreliable or never happened
**Fix**: Simplified to call the new dedicated endpoint after booking confirmation

### 6. **Enhanced Logging** ✅ IMPROVED
**File**: `app/api/payments/route.ts`
**Improvement**: Added detailed console logging throughout the payment verification and QR generation flow
**Benefit**: Makes it easier to debug issues in the future

## Flow After Fixes

### For Mock Payment (Current Checkout Form):
```
User completes payment form
    ↓
Booking status → 'confirmed'
    ↓
Call POST /api/bookings/[id]/generate-qr
    ├─ Fetch booking details with seat info
    ├─ Generate JWT token
    ├─ Generate QR image
    ├─ Save to database
    ├─ Return QR data
    ↓
Redirect to confirmation page
    ↓
QR displays immediately or fetches with GET /api/qr/generate
```

### For Razorpay Integration (Production):
```
User completes Razorpay payment
    ↓
Razorpay returns paymentId & signature
    ↓
Call PUT /api/payments (verify signature)
    ├─ Verify HMAC-SHA256 signature
    ├─ Update booking status → 'confirmed'
    ├─ Fetch booking details with seat info
    ├─ Generate JWT token
    ├─ Generate QR image
    ├─ Save to database
    ├─ Return success
    ↓
Redirect to confirmation page
    ↓
QR displays immediately
```

## Files Modified

1. ✅ `app/api/payments/route.ts` - Fixed column names, added seat details, enhanced logging
2. ✅ `lib/services/qr-database.ts` - Removed invalid database updates
3. ✅ `app/checkout/[bookingId]/checkout-client.tsx` - Updated to use new QR endpoint
4. ✅ `app/api/qr/verify/route.ts` - Fixed column name reference
5. ✅ `INTEGRATION_TEMPLATE_QR_BOOKING.ts` - Fixed template documentation
6. ✨ `app/api/bookings/[id]/generate-qr/route.ts` - **NEW** dedicated endpoint

## Testing Verification

✅ All core components tested:
- JWT token generation works
- QR code image generation works
- Database operations work
- All API routes registered and accessible
- Build compiles successfully with no errors

## How to Test Now

1. **Start the app**: `npm run dev`
2. **Navigate to** a movie showtime
3. **Select seats** and checkout
4. **Complete the payment form** (mock payment)
5. **Verify** you're directed to confirmation page
6. **QR should appear within 2-3 seconds** (no more timeout!)
7. If not, check browser F12 console for any errors
8. Check terminal for `[QR]` or `[PAYMENT API]` logs

## Next Steps for Production

When using Razorpay instead of mock payment:
1. Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are in `.env.local`
2. The payment verification endpoint automatically handles QR generation
3. No additional changes needed - system works end-to-end

## Success Indicators

✅ QR code generates immediately after booking confirmation  
✅ No more "taking longer than expected" timeout message  
✅ QR displays on confirmation page  
✅ Console logs show clear flow of generation  
✅ Database records QR with token and image  
✅ Expiration set to 4 hours from generation
