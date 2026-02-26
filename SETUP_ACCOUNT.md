# Account System Setup Guide

Your complete **My Account** system is ready! Follow one of these setup methods:

## ⚡ Method 1: Automated Setup (Recommended)

The fastest way to get started:

```bash
npm run setup
```

**Or with the interactive wizard:**

```bash
npm run setup:wizard
```

### Prerequisites for Automated Setup:
Add your Supabase Service Role Key to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> Get this from Supabase Dashboard → Project Settings → API Keys → Service Role (secret)

---

## 🔧 Method 2: Manual Database Setup

If automated setup doesn't work, use the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy-paste the entire SQL from [`scripts/020_create_account_system.sql`](scripts/020_create_account_system.sql)
6. Click **Run**
7. You should see ✅ for each table creation

---

## ✅ Verify Setup Success

After running setup, check if all 8 tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'user_%' OR table_name = 'promo_codes';
```

You should see these 12 tables:
- user_profiles ✓
- user_saved_locations ✓
- user_wishlist ✓
- user_payment_methods ✓
- user_transactions ✓
- user_refunds ✓
- user_loyalty_points ✓
- loyalty_points_history ✓
- points_redemption ✓
- promo_codes ✓
- user_promo_usage ✓
- password_change_history ✓

---

## 🚀 After Setup

### 1. Add Navigation Link (Optional but Recommended)

In [components/header.tsx](components/header.tsx) or [components/header-client.tsx](components/header-client.tsx), add:

```tsx
<Link href="/account" className="flex items-center gap-2 px-2 py-1.5">
  <User className="h-4 w-4" />
  My Account
</Link>
```

### 2. Test Your Account System

Start the development server:
```bash
npm run dev
```

Navigate to: `http://localhost:3000/account`

#### Test These 8 Features:

- [ ] **Profile** - Edit name, phone, bio, picture, date of birth
- [ ] **Saved Locations** - Add home, work, or theatre addresses
- [ ] **Wishlist** - Add/remove movies
- [ ] **Payment Methods** - Save credit/debit cards (supports Visa, Mastercard, Amex, RuPay)
- [ ] **Transactions** - View booking history and receipts
- [ ] **Offers & Promo Codes** - Browse available discount codes
- [ ] **Loyalty Points** - View points balance and redemption history
- [ ] **Settings** - Change password or delete account

### 3. (Optional) Auto-Create User Profile on First Access

The system has a built-in initialization endpoint that automatically creates user records.

**To enable it:**
Add this to your login/registration flow:
```typescript
// After user logs in, call initialize endpoint
await fetch('/api/account/initialize', {
  method: 'POST'
});
```

This will:
- Create user_profiles record
- Set up user_loyalty_points with 100-point welcome bonus
- Enable all account features immediately

---

## 📚 API Reference

All 24 API endpoints are ready to use:

### Profile
- `GET /api/account/profile` - Get user profile
- `PUT /api/account/profile` - Update profile

### Locations
- `GET /api/account/locations` - List saved locations
- `POST /api/account/locations` - Add new location
- `PUT /api/account/locations/[id]` - Update location
- `DELETE /api/account/locations/[id]` - Delete location

### Wishlist
- `GET /api/account/wishlist` - Get wishlist
- `POST /api/account/wishlist` - Add to wishlist
- `DELETE /api/account/wishlist/[id]` - Remove from wishlist

### Payment Methods
- `GET /api/account/payment-methods` - List cards
- `POST /api/account/payment-methods` - Add card
- `PUT /api/account/payment-methods/[id]` - Update card
- `DELETE /api/account/payment-methods/[id]` - Delete card

### Transactions & Refunds
- `GET /api/account/transactions` - View transactions
- `GET /api/account/refunds` - View refunds
- `POST /api/account/refunds` - Request refund

### Loyalty Points
- `GET /api/account/loyalty-points` - View balance
- `GET /api/account/loyalty-points/history` - Points history
- `POST /api/account/loyalty-points/redeem` - Redeem points

### Offers & Promo Codes
- `GET /api/account/promo-codes` - Available codes
- `GET /api/account/promo-codes/validate` - Validate code
- `GET /api/account/promo-codes/usage` - Usage history

### Account Settings
- `POST /api/account/settings/change-password` - Change password
- `DELETE /api/account/settings/delete-account` - Delete account

### System
- `GET /api/account/initialize` - Check system status
- `POST /api/account/initialize` - Initialize user

---

## 🆘 Troubleshooting

### Error: "Table does not exist"
**Solution:** You skipped the database setup. Run `npm run setup` or follow Method 2 above.

### Error: "Unauthorized"
**Solution:** Make sure you're logged in via Supabase Authentication. The account system requires a valid JWT token.

### Error: "Service Role Key not found"
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for automated setup, or use Method 2 (manual dashboard setup).

### Columns missing or wrong data type
**Solution:** The SQL file defines the complete schema. If partial setup occurred, delete existing tables and re-run the complete setup script.

---

## 📖 Documentation

For detailed information:
- [ACCOUNT_SYSTEM_DOCUMENTATION.md](ACCOUNT_SYSTEM_DOCUMENTATION.md) - Technical reference
- [ACCOUNT_SYSTEM_QUICK_START.md](ACCOUNT_SYSTEM_QUICK_START.md) - API usage guide
- [ACCOUNT_SYSTEM_IMPLEMENTATION.md](ACCOUNT_SYSTEM_IMPLEMENTATION.md) - Implementation details

---

## 🎯 What's Included

✅ **Database Schema** - 12 PostgreSQL tables with Row Level Security  
✅ **24 REST APIs** - Full CRUD operations for all features  
✅ **8 UI Sections** - Complete React components with forms  
✅ **TypeScript Types** - Full type safety  
✅ **Error Handling** - Client and server-side validation  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Auto Initialization** - Optional user record creation  

---

## ❓ Next Steps After Setup

### To integrate with your booking system:

1. **Auto-earn loyalty points on bookings**
   ```typescript
   // After confirmed booking
   await fetch('/api/account/loyalty-points/redeem', {
     method: 'POST',
     body: JSON.stringify({ 
       points_earned: Math.floor(bookingAmount * 0.1) // 10% of booking amount
     })
   });
   ```

2. **Apply promo codes at checkout**
   ```typescript
   // Before payment
   const validation = await fetch('/api/account/promo-codes/validate', {
     method: 'GET',
     headers: { 'X-Promo-Code': promoCode }
   });
   ```

3. **Save theatre as favorite location**
   ```typescript
   // After selecting theatre
   await fetch('/api/account/locations', {
     method: 'POST',
     body: JSON.stringify({
       name: theatreName,
       address: theatreAddress,
       location_type: 'theatre'
     })
   });
   ```

---

**Ready to go!** Choose your setup method above and you'll be up and running in minutes. 🚀
