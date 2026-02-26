# Quick Reference Guide - 8 Enterprise Features

## 🚀 Quick Start (5 minutes)

### Step 1: Database Setup (1 min)
```sql
-- Run in Supabase SQL Editor
-- First migration creates 16 tables with indexes
exec scripts/009_add_payments_and_ai_features.sql

-- Then run setup script for initial data
exec DATABASE_SETUP_GUIDE.sql
```

### Step 2: Environment Variables (1 min)
```bash
# Copy this to .env.local
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=app_password
SMTP_FROM_EMAIL=noreply@cinemabook.in
```

### Step 3: Deploy API Endpoints (1 min)
- Push all files in `app/api/` to production
- Endpoints auto-deploy with Next.js

### Step 4: Deploy Components (1 min)
- Push `components/enterprise-features.tsx`
- Import components where needed

### Step 5: Test (1 min)
```bash
# Test each endpoint
curl -X GET http://localhost:3000/api/translations
curl -X POST http://localhost:3000/api/promo-codes \
  -H "Content-Type: application/json" \
  -d '{"code":"SUMMER20","bookingAmount":1000}'
```

---

## 📋 API Endpoints Summary

### Payment Gateway
```
POST   /api/payments              - Create payment order
PUT    /api/payments              - Verify payment
GET    /api/payments              - Get payment history
```

### Promo Codes
```
POST   /api/promo-codes           - Validate code
PUT    /api/promo-codes           - Apply code
GET    /api/promo-codes           - List active codes
```

### Email Notifications
```
POST   /api/email-notifications   - Send email
GET    /api/email-notifications   - Get history
PUT    /api/email-notifications   - Create template
```

### Chatbot
```
POST   /api/chatbot               - Send message
GET    /api/chatbot               - Get history
PUT    /api/chatbot               - Escalate
GET    /api/chatbot/faq           - Get FAQ articles
POST   /api/chatbot/faq           - Rate article
```

### Translations
```
GET    /api/translations          - List languages
POST   /api/translations          - Fetch translation
PUT    /api/translations          - Set preference
PATCH  /api/translations          - Get preference
```

### Price Alerts
```
POST   /api/price-alerts          - Create alert
GET    /api/price-alerts          - Get user alerts
DELETE /api/price-alerts          - Remove alert
PATCH  /api/price-alerts          - Get prediction
```

### Fraud Detection
```
POST   /api/fraud-detection       - Analyze booking
GET    /api/fraud-detection       - Get alerts (admin)
PUT    /api/fraud-detection       - Review alert (admin)
```

### Group Bookings
```
POST   /api/group-bookings        - Apply discount
GET    /api/group-bookings        - Get discount
PUT    /api/group-bookings        - Admin stats
```

---

## 🧩 React Components

### Import All Components
```tsx
import {
  PaymentGatewaySelector,
  PromoCodeInput,
  LanguageSelector,
  ChatbotWidget,
  PriceAlertManager,
  GroupBookingNotice,
  EmailNotificationSettings,
  FraudAlertDashboard
} from '@/components/enterprise-features';
```

### Use in Your Pages
```tsx
// Payment page
<PaymentGatewaySelector onSelect={(gateway) => {}} />

// Booking page
<GroupBookingNotice ticketCount={8} pricePerTicket={250} />
<PromoCodeInput bookingAmount={2000} onApply={(d) => {}} />

// Header
<LanguageSelector onLanguageChange={(lang) => {}} />

// Any page
<ChatbotWidget />

// Settings page
<EmailNotificationSettings />
<PriceAlertManager movieId="123" />

// Admin page
<FraudAlertDashboard />
```

---

## 💾 Database Tables (16)

| Feature | Tables | Key Fields |
|---------|--------|-----------|
| **Payments** | payment_gateways, payments | gateway_id, amount, status |
| **Promo** | promo_codes, promo_code_usage | code, discount_value, valid_until |
| **Email** | email_templates, email_notifications | template_name, status, sent_at |
| **Chatbot** | chatbot_conversations, faq_articles | messages, question, category |
| **i18n** | languages, translations, user_language_preferences | language_code, translation_key |
| **Pricing** | price_history, price_drop_alerts | price, target_price, recorded_at |
| **Fraud** | fraud_detection_rules, fraud_alerts | risk_score, rule_type, status |
| **Bookings** | group_bookings | group_size, discount_percentage |

---

## 🔐 Authentication & Authorization

### All Endpoints Require
```typescript
// Automatic via Supabase Auth middleware
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401 Unauthorized;
```

### Admin-Only Endpoints
```typescript
// Fraud detection, group stats, template creation
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') return 403 Forbidden;
```

---

## 📊 Key Database Queries

### Active Promo Codes
```sql
SELECT * FROM promo_codes 
WHERE is_active = true 
AND current_date BETWEEN valid_from AND valid_until;
```

### User's Fraud Alerts (Admin)
```sql
SELECT * FROM fraud_alerts 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Price Trend for Movie
```sql
SELECT 
  AVG(price) as avg_price,
  MAX(price) as max_price,
  MIN(price) as min_price,
  COUNT(*) as data_points
FROM price_history 
WHERE showtime_id = $1 
AND recorded_at > now() - interval '30 days';
```

### Group Booking Stats
```sql
SELECT 
  COUNT(*) as total_bookings,
  SUM(group_size) as total_tickets,
  SUM(discount_amount) as total_savings,
  ROUND(AVG(group_size), 2) as avg_group_size
FROM group_bookings;
```

---

## 🧪 Test Data

### Sample Promo Codes (Already in Database)
```
SUMMER20    - 20% off (June-Aug)
MONSOON15   - 15% off (July-Sep)
GROUPBUY10  - ₹100 off group bookings
FIRSTBOOK25 - 25% off first booking
WEEKEND50   - ₹50 off weekends
```

### Sample Test Payment
```json
{
  "bookingId": "booking-123",
  "amount": 500,
  "currency": "INR",
  "gateway": "razorpay",
  "paymentMethod": "card"
}
```

### Sample Fraud Check
```json
{
  "bookingId": "booking-123",
  "userId": "user-123",
  "amount": 750,
  "paymentMethod": "card",
  "userLocation": "17.3850",
  "deviceInfo": "Chrome/MacOS"
}
```

---

## ⚙️ Common Configuration

### Payment Gateways Setup
```sql
-- Check which gateways are enabled
SELECT name, is_active, fee_percentage 
FROM payment_gateways;

-- Update Razorpay keys
UPDATE payment_gateways 
SET api_key = 'new_key', api_secret = 'new_secret'
WHERE name = 'razorpay';
```

### Email Template Variables
```
booking_confirmation:  {{user_name}}, {{movie_title}}, {{show_time}}, {{seats}}
payment_receipt:       {{transaction_id}}, {{amount}}, {{payment_method}}
booking_reminder:      {{movie_title}}, {{hours_until}}, {{theater_name}}
cancellation:          {{booking_id}}, {{refund_amount}}, {{movie_title}}
```

### Language Management
```sql
-- List all languages
SELECT code, display_name, is_active FROM languages;

-- Add translation
INSERT INTO translations (language_id, translation_key, translation_value, context)
SELECT id, 'key', 'value', 'ui' FROM languages WHERE code = 'en';

-- Get user language preference
SELECT * FROM user_language_preferences 
WHERE user_id = 'user-123';
```

---

## 🐛 Troubleshooting

### Payment Not Working
```
❌ Error: "Razorpay key not found"
✅ Fix: Check RAZORPAY_KEY_ID in .env

❌ Error: "Signature verification failed"
✅ Fix: Verify RAZORPAY_KEY_SECRET matches

❌ Error: "Order creation failed"
✅ Fix: Check amount > 0, test keys active
```

### Email Not Sending
```
❌ Error: "SMTP connection failed"
✅ Fix: Verify SMTP_HOST, SMTP_PORT, credentials

❌ Error: "Template not found"
✅ Fix: Check email_templates table, run setup script

❌ Error: "Variable substitution failed"
✅ Fix: Verify all {{variables}} are in template
```

### Chatbot Not Responding
```
❌ Error: "No FAQ articles found"
✅ Fix: Run DATABASE_SETUP_GUIDE.sql section 4

❌ Error: "Session not found"
✅ Fix: Ensure sessionId is valid UUID format

❌ Error: "Conversation history empty"
✅ Fix: Check chatbot_conversations table has data
```

### Fraud Detection Issues
```
❌ Error: "Risk score calculation failed"
✅ Fix: Verify fraud_detection_rules table populated

❌ Error: "Can't access fraud alerts"
✅ Fix: Check user has 'admin' role in profiles

❌ Error: "Booking not blocked"
✅ Fix: Risk score must be > 0.7 for auto-block
```

---

## 📈 Monitoring Dashboard

### Key Metrics to Track

**Payments**
```
- Daily transaction volume
- Success rate (target: >99%)
- Failed transactions (track, investigate)
- Average transaction value
- Payment gateway breakdown
```

**Promo Codes**
```
- Codes used vs available
- Discount revenue impact
- Most popular codes
- Usage by customer segment
```

**Email Delivery**
```
- Sent vs failed rate (target: >95% delivery)
- Email open rates
- Bounces and complaints
- Template performance
```

**Chatbot**
```
- Total conversations
- FAQ match rate
- Escalation rate (target: <10%)
- User satisfaction score
```

**Fraud Detection**
```
- Alerts generated daily
- Auto-blocked bookings
- Manual review queue
- False positive rate (track, optimize)
```

**Languages**
```
- Usage by language
- Translation coverage
- User preferences distribution
```

---

## 🚨 Alert Thresholds

```
Payment success rate < 95%     → Investigate
Email delivery rate < 90%      → Check SMTP
Fraud block rate > 5%          → Review rules
API error rate > 1%            → Scale database
Chat escalation > 20%          → Add FAQ articles
Promo code fraud > 2%          → Review codes
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `8_FEATURES_INTEGRATION_GUIDE.md` | Complete feature documentation |
| `ENV_CONFIGURATION.md` | Environment variables reference |
| `DATABASE_SETUP_GUIDE.sql` | Setup and seed data |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment verification |
| `8_ENTERPRISE_FEATURES_SUMMARY.md` | Complete project summary |
| `QUICK_REFERENCE.md` | This file |

---

## 🎯 Next Steps

1. **Execute database migrations** (5 min)
2. **Configure environment variables** (5 min)
3. **Deploy API endpoints** (2 min)
4. **Deploy React components** (2 min)
5. **Test each feature** (15 min)
6. **Monitor and optimize** (ongoing)

---

## 💡 Pro Tips

✅ **Always use test keys first** - Razorpay, etc
✅ **Cache translations** - Use Redis for performance
✅ **Monitor fraud scores** - Adjust thresholds based on data
✅ **Email templates** - Keep them simple, mobile-friendly
✅ **FAQ articles** - Update frequently based on support tickets
✅ **Price history** - Archive data >90 days to separate table
✅ **Rate limiting** - Add if scaling to millions of users

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
