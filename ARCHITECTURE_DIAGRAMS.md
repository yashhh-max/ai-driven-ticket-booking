# 8 Enterprise Features - Visual Architecture & Flow Diagrams

## 🎯 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CINEMA BOOKING SYSTEM                         │
│                    (8 Enterprise Features)                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND LAYER                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Booking Flow     │  │ Settings Pages   │  │ Admin Dashboard  │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │ • Seat Selection │  │ • Email Prefs    │  │ • Fraud Alerts   │  │
│  │ • Group Notice   │  │ • Language       │  │ • Payment Stats  │  │
│  │ • Promo Input    │  │ • Price Alerts   │  │ • Group Stats    │  │
│  │ • Payment        │  │                  │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ ChatbotWidget    │  │ LanguageSelector │  │ FraudDashboard   │  │
│  │ (Floating)       │  │ (Header/Nav)     │  │ (Admin Only)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌──────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER (31 endpoints)               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Payments     │  │ Promo Codes  │  │ Email        │               │
│  │ ─────────────│  │ ─────────────│  │ ─────────────│               │
│  │ POST: Create │  │ POST: Validate│  │ POST: Send  │               │
│  │ PUT: Verify │  │ PUT: Apply   │  │ GET: History │               │
│  │ GET: History │  │ GET: List    │  │ PUT: Template│               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Chatbot      │  │ Translations │  │ Price Alerts │               │
│  │ ─────────────│  │ ─────────────│  │ ─────────────│               │
│  │ POST: Message│  │ POST: Fetch  │  │ POST: Create │               │
│  │ GET: History │  │ PUT: Prefer  │  │ PATCH: Trend │               │
│  │ PUT: Escalate│  │ PATCH: Get   │  │ DELETE: Clear│               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │ Fraud Detect │  │ Group Booking│                                 │
│  │ ─────────────│  │ ─────────────│                                 │
│  │ POST: Analyze│  │ POST: Apply  │                                 │
│  │ GET: Alerts  │  │ GET: Details │                                 │
│  │ PUT: Review  │  │ PUT: Stats   │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌──────────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL DATABASE                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Payment System          Promotions           Communications        │
│  ─────────────────────   ─────────────────   ─────────────────────  │
│  • payment_gateways      • promo_codes        • email_templates     │
│  • payments              • promo_code_usage   • email_notifications │
│                                              • faq_articles        │
│                                                                      │
│  Internationalization    Pricing             Fraud & Security      │
│  ─────────────────────   ─────────────────   ─────────────────────  │
│  • languages             • price_history     • fraud_detection_     │
│  • translations          • price_drop_       rules                 │
│  • user_language_        alerts              • fraud_alerts        │
│    preferences                                                      │
│                                                                      │
│  Chatbot                 Bookings                                   │
│  ─────────────────────   ─────────────────                          │
│  • chatbot_              • group_bookings                           │
│    conversations                                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 💳 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PAYMENT FLOW (Feature 1)                      │
└─────────────────────────────────────────────────────────────────────┘

User Interface
    ↓
    ├─ Select Seats ──────────→ [GroupBookingNotice shows discount]
    ├─ Enter Promo ────────────→ [PromoCodeInput validates]
    ├─ Choose Gateway ─────────→ [PaymentGatewaySelector]
    │                           (Razorpay/PayPal/Google/Apple)
    │
    ↓ POST /api/payments
┌─────────────────────────────────────────────────────────────────────┐
│                      API: Create Payment Order                      │
├─────────────────────────────────────────────────────────────────────┤
│ • Authenticate user (Supabase Auth)                                 │
│ • Fetch payment gateway config from DB                              │
│ • Create Razorpay order (convert INR to paise)                      │
│ • Save payment record (status: pending)                             │
│ • Return orderId, amount, currency, keyId                           │
└─────────────────────────────────────────────────────────────────────┘
    ↓
User sees payment form
    ├─ Razorpay Checkout Modal
    ├─ User completes payment
    │
    ↓ Payment Gateway Callback
    
Razorpay returns:
    ├─ paymentId
    ├─ orderId
    └─ signature (HMAC-SHA256)
    
    ↓ PUT /api/payments (Verify)
┌─────────────────────────────────────────────────────────────────────┐
│                   API: Verify Payment Signature                     │
├─────────────────────────────────────────────────────────────────────┤
│ • Verify HMAC-SHA256 signature using Razorpay key_secret           │
│ • Update payment status → "completed"                               │
│ • Update booking status → "confirmed"                               │
│ • Create group_booking record (if applicable)                       │
│ • Return success                                                    │
└─────────────────────────────────────────────────────────────────────┘
    ↓
Background Jobs:
    ├─ POST /api/email-notifications (Send confirmation)
    ├─ POST /api/fraud-detection (Analyze for fraud)
    └─ Update price_history (track price for predictions)
    
    ↓
User receives:
    ├─ Email confirmation
    ├─ Booking reference
    └─ Show details
```

---

## 🏷️ Promo Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROMO CODE FLOW (Feature 3)                      │
└─────────────────────────────────────────────────────────────────────┘

User enters promo code
    ↓
[PromoCodeInput Component]
    ↓ POST /api/promo-codes
┌─────────────────────────────────────────────────────────────────────┐
│                      API: Validate Promo Code                       │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Find code (case-insensitive)
│    └─ If not found → Error
│
│ 2. Check date validity (today between valid_from and valid_until)
│    └─ If expired → Error
│
│ 3. Verify usage limit (current_uses < max_uses)
│    └─ If limit reached → Error
│
│ 4. Check minimum booking amount
│    └─ If below minimum → Error
│
│ 5. Calculate discount
│    • If percentage: (amount × value) / 100
│    • If fixed: direct value
│    • Cap at max_discount
│
│ 6. Return discount amount & final total
└─────────────────────────────────────────────────────────────────────┘
    ↓ If valid
[Show discount notification]
    ├─ Original: ₹1500
    ├─ Discount: ₹300 (20%)
    └─ Final: ₹1200
    
    ↓ PUT /api/promo-codes (Apply)
┌─────────────────────────────────────────────────────────────────────┐
│                      API: Apply Promo Code                          │
├─────────────────────────────────────────────────────────────────────┤
│ • Record usage in promo_code_usage table
│ • Increment current_uses counter
│ • Update booking total_amount
│ • Return success
└─────────────────────────────────────────────────────────────────────┘
    ↓
Booking confirmed with discount
```

---

## 📧 Email Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│               EMAIL NOTIFICATION FLOW (Feature 4)                   │
└─────────────────────────────────────────────────────────────────────┘

Event Triggered (e.g., Booking Confirmed)
    ↓
    ├─ Event: booking_confirmed
    ├─ User ID: user-123
    ├─ Template: booking_confirmation
    └─ Variables: {user_name, movie_title, show_time, ...}
    
    ↓ POST /api/email-notifications
┌─────────────────────────────────────────────────────────────────────┐
│                    API: Send Email via SMTP                         │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Fetch template from email_templates table
│ 2. Compile Handlebars template with variables
│ 3. Substitute {{variable}} placeholders
│ 4. Configure SMTP connection (Gmail/SendGrid/Mailgun/AWS SES)
│ 5. Send email via Nodemailer
│ 6. Log result (status: sent/failed, error_message)
│ 7. Return notificationId
└─────────────────────────────────────────────────────────────────────┘
    ↓
SMTP Server (async, non-blocking)
    ├─ Connect to SMTP
    ├─ Authenticate
    ├─ Send message
    └─ Disconnect
    
    ↓
Email Delivered to User
    ├─ Subject: Booking Confirmation - Avatar 3
    ├─ Content:
    │   ├─ Hi John,
    │   ├─ Your booking for Avatar 3 is confirmed!
    │   ├─ Show: 7:00 PM, Theater: PVR Hyderabad
    │   ├─ Seats: A1, A2, A3
    │   └─ Amount: ₹750
    
    ↓ GET /api/email-notifications
[User can view notification history]
```

---

## 🌍 Multi-Language Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│              MULTI-LANGUAGE FLOW (Feature 5)                        │
└─────────────────────────────────────────────────────────────────────┘

User clicks LanguageSelector
    ├─ English
    ├─ తెలుగు (Telugu)
    ├─ தமிழ் (Tamil)
    ├─ ಕನ್ನಡ (Kannada)
    ├─ हिंदी (Hindi)
    └─ മലയാളം (Malayalam)
    
    ↓ Select Language (e.g., Telugu)
    
    ↓ PUT /api/translations (Set preference)
┌─────────────────────────────────────────────────────────────────────┐
│                    API: Save Language Preference                    │
├─────────────────────────────────────────────────────────────────────┤
│ • Authenticate user
│ • Upsert user_language_preferences
│ • Set preferred_language_id = lang_te
└─────────────────────────────────────────────────────────────────────┘
    ↓
Frontend requests translations
    ↓ POST /api/translations
┌─────────────────────────────────────────────────────────────────────┐
│                   API: Fetch Translations                           │
├─────────────────────────────────────────────────────────────────────┤
│ • Get languageId from user preference
│ • Query translations table
│ • Key: "booking.confirm_button"
│ • Return value in selected language
│   ├─ EN: "Confirm Booking"
│   ├─ TE: "బుకింగ్‌ని నిర్ధారించండి"
│   ├─ TA: "முன்பதிவை உறுதிப்படுத்தவும்"
│   └─ etc.
│ • If translation missing, return key as fallback
└─────────────────────────────────────────────────────────────────────┘
    ↓
UI updates in selected language
    └─ All text, emails, notifications in user's language
```

---

## 💬 Chatbot Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CHATBOT FLOW (Feature 6)                           │
└─────────────────────────────────────────────────────────────────────┘

[ChatbotWidget - Floating on bottom-right]
    ↓
User types message: "How do I cancel my booking?"
    ↓
    ↓ POST /api/chatbot
┌─────────────────────────────────────────────────────────────────────┐
│                  API: Process User Message                          │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Get or create conversation session
│ 2. Extract keywords from message:
│    ["How", "cancel", "booking"]
│
│ 3. Search FAQ articles for matches:
│    ┌─ FAQ ID: faq-123
│    ├─ Question: "How do I cancel my booking?"
│    ├─ Answer: "You can cancel up to 2 hours..."
│    ├─ Keywords: [cancel, refund, money, back]
│    └─ Match score: HIGH
│
│ 4. Return matched FAQ answer
│ 5. Save conversation:
│    • User message: "How do I cancel my booking?"
│    • Bot response: "You can cancel up to 2 hours..."
│    • Timestamp: 2024-01-15T10:30:00Z
└─────────────────────────────────────────────────────────────────────┘
    ↓
Display response in chat bubble
    ├─ Bot: "You can cancel your booking up to 2 hours..."
    ├─ Helpful? [👍] [👎]
    └─ [Escalate to Human]
    
    ↓ If user not satisfied
    
    ↓ PUT /api/chatbot (Escalate)
┌─────────────────────────────────────────────────────────────────────┐
│                   API: Escalate to Human                            │
├─────────────────────────────────────────────────────────────────────┤
│ • Mark conversation as escalated
│ • Notify support team
│ • Connect to human agent (via external chat service)
└─────────────────────────────────────────────────────────────────────┘
    ↓
Human support agent takes over
    └─ "Hi, I'm here to help. What's the issue?"
```

---

## 📊 Price Prediction Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│             PRICE PREDICTION FLOW (Feature 7)                       │
└─────────────────────────────────────────────────────────────────────┘

User sets price alert: "Alert me when Avatar 3 drops below ₹200"
    ↓
    ↓ POST /api/price-alerts
┌─────────────────────────────────────────────────────────────────────┐
│                    API: Create Price Alert                          │
├─────────────────────────────────────────────────────────────────────┤
│ • Save alert
│   ├─ user_id: user-123
│   ├─ movie_id: movie-456
│   ├─ target_price: 200
│   └─ status: active
│ • Return alertId
└─────────────────────────────────────────────────────────────────────┘
    ↓
Background job (hourly):
    ├─ Check current price vs target
    ├─ If price < target → Alert triggered
    └─ Send email notification
    
    ↓
User requests price prediction
    ↓ PATCH /api/price-alerts
┌─────────────────────────────────────────────────────────────────────┐
│                   API: Analyze Price Trend                          │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Fetch 30-day price history
│    ├─ Day 1: ₹400
│    ├─ Day 15: ₹350
│    ├─ Day 30: ₹450
│
│ 2. Calculate statistics:
│    ├─ Average: ₹380
│    ├─ Max: ₹450
│    ├─ Min: ₹300
│    ├─ Trend: Increasing (last > first)
│    └─ Volatility: ₹150
│
│ 3. Provide recommendation:
│    "Price is increasing. Book now before prices go up."
└─────────────────────────────────────────────────────────────────────┘
    ↓
[PriceAlertManager Component]
    ├─ Current Price: ₹450
    ├─ Average: ₹380
    ├─ Trend: ↑ Increasing
    ├─ Volatility: ₹150
    └─ Recommendation: "Book now!"
```

---

## 🚨 Fraud Detection Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│              FRAUD DETECTION FLOW (Feature 8)                       │
└─────────────────────────────────────────────────────────────────────┘

User submits booking
    ↓
    ↓ POST /api/fraud-detection
┌─────────────────────────────────────────────────────────────────────┐
│                  API: Analyze Booking for Fraud                     │
├─────────────────────────────────────────────────────────────────────┤
│ Rule 1: Velocity Check
│ ├─ Query: Bookings in last 1 hour
│ ├─ Count: 6 bookings
│ ├─ Threshold: 5
│ ├─ Result: ALERT (+0.3 risk)
│
│ Rule 2: Amount Check
│ ├─ Current: ₹500
│ ├─ Average: ₹250
│ ├─ Multiplier: 3 (threshold)
│ ├─ 500 > 250×3? NO
│ ├─ Result: OK
│
│ Rule 3: Location Check
│ ├─ Last location: 17.38°N (Hyderabad)
│ ├─ Current: 28.60°N (Delhi)
│ ├─ Distance: ~1700km > 500km
│ ├─ Result: ALERT (+0.1 risk)
│
│ Rule 4: Payment Pattern
│ ├─ Recent payment methods: 2 different
│ ├─ Threshold: 3
│ ├─ Result: OK
│
│ Rule 5: Account Age
│ ├─ Account created: 3 days ago
│ ├─ Recent bookings: 6
│ ├─ Threshold: max 5 in 7 days
│ ├─ Result: ALERT (+0.25 risk)
│
│ TOTAL RISK SCORE: 0.65 (0.3 + 0.1 + 0.25)
└─────────────────────────────────────────────────────────────────────┘
    ↓
Risk Level: 0.65 (Between 0.3-0.7 = REVIEW REQUIRED)
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Fraud Alert Created                              │
├─────────────────────────────────────────────────────────────────────┤
│ • alertId: alert-xyz
│ • riskScore: 0.65
│ • status: pending_review
│ • flaggedRules: ["VELOCITY_ALERT", "LOCATION_ALERT", "ACCOUNT_AGE"]
└─────────────────────────────────────────────────────────────────────┘
    ↓
Admin Reviews in FraudAlertDashboard
    ├─ Risk: 65%
    ├─ Violations: 3
    ├─ [Approve] [Block] buttons
    
    ↓ Admin clicks [Approve]
    
    ↓ PUT /api/fraud-detection
┌─────────────────────────────────────────────────────────────────────┐
│                     Admin Reviews Alert                             │
├─────────────────────────────────────────────────────────────────────┤
│ • status: approved
│ • reviewed_by: admin-user-id
│ • Booking proceeds normally
└─────────────────────────────────────────────────────────────────────┘
    ↓
If Risk Score > 0.7 (AUTO-BLOCK):
    └─ Booking automatically rejected
    └─ User: "Booking declined for security reasons"
```

---

## 👥 Group Booking Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│              GROUP BOOKING FLOW (Feature 2)                         │
└─────────────────────────────────────────────────────────────────────┘

User selects 8 seats
    ↓
[GroupBookingNotice Component]
    └─ Shows: "Group discount of 5% available!"
    └─ Original: ₹2000 (8 × ₹250)
    └─ Discount: ₹100 (5%)
    └─ Final: ₹1900
    
    ↓ User proceeds to payment
    
    ↓ POST /api/group-bookings
┌─────────────────────────────────────────────────────────────────────┐
│                 API: Apply Group Discount                           │
├─────────────────────────────────────────────────────────────────────┤
│ Input:
│ ├─ bookingId
│ ├─ numberOfTickets: 8
│ └─ pricePerTicket: ₹250
│
│ Logic:
│ ├─ Check: tickets >= 5? YES
│ ├─ Check: tickets < 10? YES → Tier 1 (5% discount)
│ ├─ Calculate: (8 × 250 × 5) / 100 = ₹100
│ ├─ Final total: ₹1900
│
│ Output:
│ ├─ Save to group_bookings table
│ ├─ Update booking.total_amount = ₹1900
│ └─ Return success
└─────────────────────────────────────────────────────────────────────┘
    ↓
Payment processed with discounted amount (₹1900)
    ↓
Admin can view PUT /api/group-bookings (statistics):
    ├─ Total group bookings: 156
    ├─ Total tickets: 1,840
    ├─ Average group size: 11.79
    ├─ Total savings given: ₹28,750
    └─ Tier breakdown:
        ├─ 5-9 tickets: 45 bookings
        ├─ 10-19 tickets: 89 bookings
        └─ 20+ tickets: 22 bookings
```

---

## 🔐 Security & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY MODEL                                   │
└─────────────────────────────────────────────────────────────────────┘

Every API Request:
    ↓
    ├─ 1. Authentication Check
    │   └─ Get user from Supabase Auth
    │   └─ If no user → 401 Unauthorized
    │
    ├─ 2. Authorization Check
    │   ├─ For admin endpoints: Check user.role == 'admin'
    │   ├─ For user data: Check user.id == data.user_id
    │   └─ If no permission → 403 Forbidden
    │
    ├─ 3. Database Access Control (RLS)
    │   └─ Only records visible to authenticated user
    │   └─ Admin can see all fraud alerts
    │   └─ Users see only own data
    │
    ├─ 4. Input Validation
    │   ├─ Validate types, ranges, formats
    │   ├─ Sanitize strings (prevent SQL injection)
    │   └─ If invalid → 400 Bad Request
    │
    └─ 5. Signature Verification (Payments)
        └─ Verify HMAC-SHA256 signature
        └─ Ensure data hasn't been tampered
        └─ If invalid → 401 Unauthorized

All endpoints encrypted via HTTPS
All sensitive data in environment variables
All secrets rotated regularly
```

---

## 📱 Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT TREE                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  App Layout                                                        │
│  ├─ Header                                                         │
│  │  ├─ [LanguageSelector] ──→ switches language                   │
│  │  └─ [ChatbotWidget] ──────→ floating chat                      │
│  │                                                                 │
│  ├─ Main Content                                                   │
│  │  ├─ Booking Page                                                │
│  │  │  ├─ MovieSelector                                            │
│  │  │  ├─ ShowtimePicker                                           │
│  │  │  ├─ [SeatSelector]                                           │
│  │  │  ├─ [GroupBookingNotice] ──→ shows discount                 │
│  │  │  ├─ [PromoCodeInput] ──────→ validates code                 │
│  │  │  └─ CheckoutSummary                                          │
│  │  │                                                              │
│  │  ├─ Payment Page                                                │
│  │  │  ├─ [PaymentGatewaySelector] ──→ chooses payment            │
│  │  │  ├─ RazorpayCheckout                                        │
│  │  │  └─ PaymentStatus                                            │
│  │  │                                                              │
│  │  ├─ Settings Page                                               │
│  │  │  ├─ [EmailNotificationSettings]                             │
│  │  │  ├─ [PriceAlertManager]                                     │
│  │  │  └─ [LanguageSelector]                                      │
│  │  │                                                              │
│  │  └─ Admin Dashboard                                             │
│  │     ├─ [FraudAlertDashboard] ──→ review alerts                │
│  │     ├─ PaymentAnalytics                                        │
│  │     └─ SystemMetrics                                           │
│  │                                                                 │
│  └─ Footer                                                         │
│     └─ Support Links                                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Summary

```
User Action → React Component → API Endpoint → Database → Response → Update UI

Payment:      ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Promo:        ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Email:        ❶ → ❷ → ❸ → ❹ → SMTP → ❻
Chatbot:      ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Language:     ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Price Alert:  ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Fraud:        ❶ → ❷ → ❸ → ❹ → ❺ → ❻
Group:        ❶ → ❷ → ❸ → ❹ → ❺ → ❻

❶ = User action
❷ = React component handles
❸ = API call (POST/GET/PUT)
❹ = Database query/update
❺ = Response returned
❻ = UI updated
```

---

**Version**: 1.0  
**Status**: Complete & Production Ready ✅
