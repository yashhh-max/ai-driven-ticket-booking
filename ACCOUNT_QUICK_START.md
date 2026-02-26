# Account System Quick Start

## 🎯 Complete Implementation Summary

Your **My Account** system includes **8 core features** with **24 REST APIs** and full database integration.

---

## 📦 What You Get

### 8 Feature Sections (Interactive Tabs)

| Feature | Capabilities | API Endpoints | Database Tables |
|---------|-------------|-------|---------|
| **👤 Profile** | Edit name, phone, bio, picture, DOB, gender | `GET/PUT /api/account/profile` | `user_profiles` |
| **📍 Locations** | Save home, work, theatre addresses | `GET/POST/PUT/DELETE /api/account/locations/[id]` | `user_saved_locations` |
| **❤️ Wishlist** | Add/remove movies, view details | `GET/POST/DELETE /api/account/wishlist/[id]` | `user_wishlist` |
| **💳 Payment** | Save cards (Visa, MC, Amex, RuPay) | `GET/POST/PUT/DELETE /api/account/payment-methods/[id]` | `user_payment_methods` |
| **📊 Transactions** | View booking history, receipts, refunds | `GET /api/account/transactions` `GET/POST /api/account/refunds` | `user_transactions`, `user_refunds` |
| **🎁 Offers** | Browse & validate promo codes | `GET /api/account/promo-codes` `GET /api/account/promo-codes/validate` | `promo_codes`, `user_promo_usage` |
| **⭐ Loyalty** | View points balance, earn & redeem | `GET/POST /api/account/loyalty-points/*` | `user_loyalty_points`, `loyalty_points_history`, `points_redemption` |
| **⚙️ Settings** | Change password, delete account | `POST /api/account/settings/change-password` `DELETE /api/account/settings/delete-account` | `password_change_history` |

---

## ⚡ Quick Setup (3 Options)

### Option A: Automated (Fastest)
```bash
npm run setup
```
✅ Automatic database migration  
✅ Verifies all 12 tables created  
✅ No manual dashboard steps  

**Requires:** `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

### Option B: Interactive Wizard (Guided)
```bash
npm run setup:wizard
```
✅ Step-by-step setup  
✅ Helper prompts and fallbacks  
✅ Feature testing checklist  
✅ Navigation integration guide  

---

### Option C: Manual (Most Control)
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Click **SQL Editor** → **New Query**
3. Copy-paste [scripts/020_create_account_system.sql](scripts/020_create_account_system.sql)
4. Click **Run**

---

## ✅ Verify Setup (1 Query)

In Supabase SQL Editor, run:

```sql
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles', 'user_saved_locations', 'user_wishlist', 'user_payment_methods',
  'user_transactions', 'user_refunds', 'user_loyalty_points', 'loyalty_points_history',
  'points_redemption', 'promo_codes', 'user_promo_usage', 'password_change_history'
);
```

**Expected result:** `table_count = 12` ✓

---

## 🚀 After Setup

### 1. Start Development
```bash
npm run dev
```

### 2. Access Account Page
Open: [http://localhost:3000/account](http://localhost:3000/account)

### 3. Test All 8 Features
- [ ] Edit profile (name, phone, bio, picture, DOB)
- [ ] Add saved location (home/work/theatre)
- [ ] Add movie to wishlist
- [ ] Add payment method (card details)
- [ ] View transactions and refunds
- [ ] Browse and validate promo codes
- [ ] Check loyalty points balance
- [ ] View/change password in settings

### 4. (Optional) Add Navigation Link

In `components/header.tsx` or `components/header-client.tsx`:

```tsx
<Link href="/account" className="flex items-center gap-2">
  <User className="h-4 w-4" />
  My Account
</Link>
```

---

## 📚 API Reference

### Profile Management
```typescript
// Get user profile
GET /api/account/profile

// Update profile
PUT /api/account/profile
{
  full_name?: string,
  phone_number?: string,
  bio?: string,
  profile_picture_url?: string,
  date_of_birth?: string,
  gender?: 'male' | 'female' | 'other'
}
```

### Locations
```typescript
// List all locations
GET /api/account/locations

// Add location
POST /api/account/locations
{
  name: string,
  address: string,
  city: string,
  postal_code: string,
  location_type: 'home' | 'work' | 'theatre' | 'other'
}

// Update/delete
PUT /api/account/locations/[id]
DELETE /api/account/locations/[id]
```

### Wishlist
```typescript
// Get wishlist
GET /api/account/wishlist

// Add movie
POST /api/account/wishlist
{
  movie_id: string,
  movie_title: string,
  poster_url?: string
}

// Remove movie
DELETE /api/account/wishlist/[id]
```

### Payment Methods
```typescript
// List cards
GET /api/account/payment-methods

// Add card
POST /api/account/payment-methods
{
  card_number: string,
  cardholder_name: string,
  expiry_month: number,
  expiry_year: number,
  cvv: string,
  card_type: 'visa' | 'mastercard' | 'amex' | 'rupay',
  is_default: boolean
}

// Update/delete
PUT /api/account/payment-methods/[id]
DELETE /api/account/payment-methods/[id]
```

### Transactions & Refunds
```typescript
// View transactions (paginated)
GET /api/account/transactions?page=1&limit=20

// View refunds
GET /api/account/refunds?page=1&limit=20

// Request refund
POST /api/account/refunds
{
  transaction_id: string,
  reason: string,
  amount?: number
}
```

### Loyalty Points
```typescript
// Get balance
GET /api/account/loyalty-points

// View history
GET /api/account/loyalty-points/history?page=1&limit=20

// Redeem points
POST /api/account/loyalty-points/redeem
{
  points_to_redeem: number
}
```

### Promo Codes
```typescript
// Browse available codes
GET /api/account/promo-codes

// Validate code
GET /api/account/promo-codes/validate?code=CODE123

// View usage history
GET /api/account/promo-codes/usage?page=1&limit=20
```

### Settings
```typescript
// Change password
POST /api/account/settings/change-password
{
  current_password: string,
  new_password: string,
  confirm_password: string
}

// Delete account (requires password)
DELETE /api/account/settings/delete-account
{
  password: string
}
```

### System
```typescript
// Check system status
GET /api/account/initialize

// Initialize user (creates profile + loyalty points)
POST /api/account/initialize
```

---

## 💼 Integration Guide

### Auto-Earn Loyalty Points on Booking

After a successful booking:
```typescript
async function awardLoyaltyPoints(bookingAmount: number) {
  const pointsEarned = Math.floor(bookingAmount * 0.1); // 10% of amount
  
  const response = await fetch('/api/account/loyalty-points/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points_to_redeem: pointsEarned })
  });
  
  return response.json();
}
```

### Apply Promo Code at Checkout

Before processing payment:
```typescript
async function validateAndApplyPromoCode(code: string) {
  const response = await fetch(
    `/api/account/promo-codes/validate?code=${encodeURIComponent(code)}`
  );
  
  const data = await response.json();
  
  if (data.valid) {
    // Apply discount: data.discount_percentage or data.discount_amount
    return data;
  } else {
    throw new Error('Invalid or expired promo code');
  }
}
```

### Save Theatre as Favorite Location

After selecting theatre:
```typescript
async function saveTheatreLocation(theatreName: string, theatreAddress: string) {
  const response = await fetch('/api/account/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: theatreName,
      address: theatreAddress,
      location_type: 'theatre'
    })
  });
  
  return response.json();
}
```

### Auto-Initialize User Profile

On login/first access:
```typescript
async function ensureUserProfile() {
  // Check if user needs initialization
  const statusResponse = await fetch('/api/account/initialize');
  const status = await statusResponse.json();
  
  if (!status.ready) {
    // Create profile and loyalty points
    await fetch('/api/account/initialize', { method: 'POST' });
  }
}
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Table does not exist` | Run setup: `npm run setup` |
| `Unauthorized` | Make sure you're logged in via Supabase Auth |
| `Service Role Key not found` | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` |
| `Column missing` | Re-run setup script or use Supabase Dashboard directly |
| `CORS error` | Check API route authentication headers |

---

## 📖 Documentation

- **[SETUP_ACCOUNT.md](SETUP_ACCOUNT.md)** - Detailed setup guide (3 methods)
- **[ACCOUNT_SYSTEM_DOCUMENTATION.md](ACCOUNT_SYSTEM_DOCUMENTATION.md)** - Technical reference
- **[ACCOUNT_SYSTEM_IMPLEMENTATION.md](ACCOUNT_SYSTEM_IMPLEMENTATION.md)** - Architecture & implementation
- **[public/setup-account.html](public/setup-account.html)** - Interactive setup page

---

## 📋 File Structure

```
account-system/
├── app/
│   ├── account/
│   │   └── page.tsx              # Main dashboard (8 tabs)
│   └── api/account/
│       ├── profile/
│       ├── locations/
│       ├── wishlist/
│       ├── payment-methods/
│       ├── transactions/
│       ├── refunds/
│       ├── loyalty-points/
│       ├── promo-codes/
│       ├── settings/
│       └── initialize/
├── components/account/
│   ├── profile-section.tsx
│   ├── locations-section.tsx
│   ├── wishlist-section.tsx
│   ├── payment-section.tsx
│   ├── transactions-section.tsx
│   ├── offers-section.tsx
│   ├── loyalty-section.tsx
│   └── settings-section.tsx
├── lib/
│   ├── services/account-api.ts    # Centralized API client
│   ├── utils/date-utils.ts
│   └── types.ts                   # TypeScript interfaces
├── scripts/
│   ├── 020_create_account_system.sql  # Database schema
│   ├── setup-account-system.js
│   └── setup-wizard.js
└── public/
    └── setup-account.html         # Interactive setup page
```

---

## 🎯 Next Steps

1. ✅ Choose setup method (automated/wizard/manual)
2. ✅ Run setup script or SQL
3. ✅ Verify all 12 tables created
4. ✅ Start `npm run dev`
5. ✅ Test `/account` page (all 8 features)
6. ✅ Add navigation link to header
7. ✅ Integrate with booking system (optional)

---

## 💡 Features Included

✅ **24 REST APIs** - Full CRUD for all operations  
✅ **8 Feature Sections** - Complete UI with forms  
✅ **Row Level Security** - PostgreSQL RLS policies  
✅ **Type Safety** - Full TypeScript interfaces  
✅ **Error Handling** - Client & server validation  
✅ **Responsive Design** - Mobile & desktop  
✅ **Auto Initialization** - Create user records on first access  
✅ **Documented** - 3 complete documentation files  

---

**Ready to go!** Pick a setup method and you'll be live in minutes. 🚀
