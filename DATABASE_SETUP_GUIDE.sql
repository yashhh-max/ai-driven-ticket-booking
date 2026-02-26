-- ============================================================================
-- SETUP GUIDE: 8 ENTERPRISE FEATURES
-- ============================================================================
-- This SQL guide covers setting up all required data for the 8 features:
-- 1. Multiple Payment Gateways
-- 2. Group Booking Discounts
-- 3. Promotional Codes
-- 4. Email Notifications
-- 5. Multi-Language Support
-- 6. Chatbot with FAQ
-- 7. Price Alerts & Prediction
-- 8. Fraud Detection
--
-- First, run: scripts/009_add_payments_and_ai_features.sql
-- Then, run this guide in sections:
-- ============================================================================

-- ============================================================================
-- SECTION 1: PAYMENT GATEWAY SETUP
-- ============================================================================

-- Insert Razorpay (Primary Gateway)
INSERT INTO payment_gateways (id, name, api_key, api_secret, webhook_secret, fee_percentage, supported_currencies, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'razorpay',
  'YOUR_RAZORPAY_KEY_ID',
  'YOUR_RAZORPAY_KEY_SECRET',
  'YOUR_RAZORPAY_WEBHOOK_SECRET',
  2.0,
  ARRAY['INR', 'USD'],
  true,
  now()
)
ON CONFLICT (name) DO UPDATE
SET api_key = EXCLUDED.api_key,
    api_secret = EXCLUDED.api_secret;

-- Insert PayPal (For future use)
INSERT INTO payment_gateways (id, name, api_key, api_secret, webhook_secret, fee_percentage, supported_currencies, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'paypal',
  'YOUR_PAYPAL_CLIENT_ID',
  'YOUR_PAYPAL_CLIENT_SECRET',
  'YOUR_PAYPAL_WEBHOOK_SECRET',
  3.5,
  ARRAY['USD', 'EUR', 'GBP'],
  false,
  now()
)
ON CONFLICT (name) DO NOTHING;

-- Insert Google Pay (For future use)
INSERT INTO payment_gateways (id, name, api_key, api_secret, webhook_secret, fee_percentage, supported_currencies, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'googlepay',
  'YOUR_GOOGLE_PAY_API_KEY',
  'YOUR_GOOGLE_PAY_SECRET',
  'YOUR_GOOGLE_PAY_WEBHOOK_SECRET',
  1.5,
  ARRAY['INR'],
  false,
  now()
)
ON CONFLICT (name) DO NOTHING;

-- Insert Apple Pay (For future use)
INSERT INTO payment_gateways (id, name, api_key, api_secret, webhook_secret, fee_percentage, supported_currencies, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'applepay',
  'YOUR_APPLE_PAY_MERCHANT_ID',
  'YOUR_APPLE_PAY_SECRET',
  'YOUR_APPLE_PAY_WEBHOOK_SECRET',
  1.5,
  ARRAY['INR', 'USD'],
  false,
  now()
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 2: EMAIL TEMPLATE SETUP
-- ============================================================================

-- Booking Confirmation Template
INSERT INTO email_templates (id, name, subject, template_html, template_text, variables, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'booking_confirmation',
  'Booking Confirmation - {{movie_title}}',
  '<h2>Hi {{user_name}},</h2>
<p>Your booking for <strong>{{movie_title}}</strong> is confirmed!</p>
<p><strong>Show Details:</strong></p>
<ul>
  <li>Date & Time: {{show_time}}</li>
  <li>Theater: {{theater_name}}</li>
  <li>Seats: {{seats}}</li>
  <li>Total Amount: ₹{{total_amount}}</li>
</ul>
<p>Your booking reference: {{booking_id}}</p>
<p>Please arrive 15 minutes before the show.</p>',
  'Hi {{user_name}}, Your booking for {{movie_title}} is confirmed! Show: {{show_time}}, Theater: {{theater_name}}, Seats: {{seats}}, Amount: ₹{{total_amount}}, Reference: {{booking_id}}',
  ARRAY['user_name', 'movie_title', 'show_time', 'theater_name', 'seats', 'total_amount', 'booking_id'],
  true,
  now()
);

-- Payment Receipt Template
INSERT INTO email_templates (id, name, subject, template_html, template_text, variables, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'payment_receipt',
  'Payment Receipt - ₹{{amount}}',
  '<h2>Payment Confirmation</h2>
<p>Hi {{user_name}},</p>
<p>Your payment has been successfully processed!</p>
<p><strong>Transaction Details:</strong></p>
<ul>
  <li>Transaction ID: {{transaction_id}}</li>
  <li>Amount: ₹{{amount}}</li>
  <li>Payment Method: {{payment_method}}</li>
  <li>Date & Time: {{date}}</li>
  <li>Status: SUCCESS</li>
</ul>',
  'Payment Receipt - Transaction ID: {{transaction_id}}, Amount: ₹{{amount}}, Method: {{payment_method}}, Date: {{date}}',
  ARRAY['user_name', 'transaction_id', 'amount', 'payment_method', 'date'],
  true,
  now()
);

-- Booking Reminder Template
INSERT INTO email_templates (id, name, subject, template_html, template_text, variables, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'booking_reminder',
  'Reminder: {{movie_title}} in {{hours_until}} hours',
  '<h2>Your show is coming up!</h2>
<p>Hi {{user_name}},</p>
<p>Reminder: Your booking for <strong>{{movie_title}}</strong> is in {{hours_until}} hours!</p>
<p><strong>Details:</strong></p>
<ul>
  <li>Time: {{show_time}}</li>
  <li>Theater: {{theater_name}}</li>
  <li>Location: {{theater_address}}</li>
  <li>Seats: {{seats}}</li>
</ul>
<p>See you soon!</p>',
  'Reminder: {{movie_title}} in {{hours_until}} hours at {{theater_name}}, {{show_time}}',
  ARRAY['user_name', 'movie_title', 'hours_until', 'show_time', 'theater_name', 'theater_address', 'seats'],
  true,
  now()
);

-- Cancellation Confirmation Template
INSERT INTO email_templates (id, name, subject, template_html, template_text, variables, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'cancellation_confirmation',
  'Booking Cancelled - Refund ₹{{refund_amount}}',
  '<h2>Booking Cancelled</h2>
<p>Hi {{user_name}},</p>
<p>Your booking has been successfully cancelled.</p>
<p><strong>Refund Details:</strong></p>
<ul>
  <li>Booking ID: {{booking_id}}</li>
  <li>Refund Amount: ₹{{refund_amount}}</li>
  <li>Status: REFUND PROCESSED</li>
  <li>Movie: {{movie_title}}</li>
</ul>
<p>The refund will be credited to your original payment method within 3-5 business days.</p>',
  'Booking Cancelled - Refund ₹{{refund_amount}} will be processed within 3-5 business days',
  ARRAY['user_name', 'booking_id', 'refund_amount', 'movie_title'],
  true,
  now()
);

-- ============================================================================
-- SECTION 3: LANGUAGE & TRANSLATION SETUP
-- ============================================================================

-- Insert Languages
INSERT INTO languages (id, code, name, display_name, is_active, direction)
VALUES
  (gen_random_uuid(), 'en', 'English', 'English', true, 'ltr'),
  (gen_random_uuid(), 'te', 'Telugu', 'తెలుగు', true, 'ltr'),
  (gen_random_uuid(), 'ta', 'Tamil', 'தமிழ்', true, 'ltr'),
  (gen_random_uuid(), 'kn', 'Kannada', 'ಕನ್ನಡ', true, 'ltr'),
  (gen_random_uuid(), 'hi', 'Hindi', 'हिंदी', true, 'ltr'),
  (gen_random_uuid(), 'ml', 'Malayalam', 'മലയാളം', true, 'ltr')
ON CONFLICT (code) DO NOTHING;

-- Sample Translations (English)
INSERT INTO translations (id, language_id, translation_key, translation_value, context)
SELECT gen_random_uuid(), id, 'booking.confirm_button', 'Confirm Booking', 'ui'
FROM languages WHERE code = 'en'
ON CONFLICT (language_id, translation_key, context) DO NOTHING;

INSERT INTO translations (id, language_id, translation_key, translation_value, context)
SELECT gen_random_uuid(), id, 'payment.processing', 'Processing payment...', 'ui'
FROM languages WHERE code = 'en'
ON CONFLICT (language_id, translation_key, context) DO NOTHING;

-- Sample Translations (Telugu)
INSERT INTO translations (id, language_id, translation_key, translation_value, context)
SELECT gen_random_uuid(), id, 'booking.confirm_button', 'బుకింగ్‌ని నిర్ధారించండి', 'ui'
FROM languages WHERE code = 'te'
ON CONFLICT (language_id, translation_key, context) DO NOTHING;

INSERT INTO translations (id, language_id, translation_key, translation_value, context)
SELECT gen_random_uuid(), id, 'payment.processing', 'చెల్లింపు ప్రక్రియ చేస్తోంది...', 'ui'
FROM languages WHERE code = 'te'
ON CONFLICT (language_id, translation_key, context) DO NOTHING;

-- ============================================================================
-- SECTION 4: FAQ ARTICLES SETUP
-- ============================================================================

-- Booking FAQs (English)
INSERT INTO faq_articles (id, language_id, question, answer, category, keywords, helpful_count, is_published, created_at)
SELECT 
  gen_random_uuid(),
  id,
  'How do I book movie tickets?',
  'To book tickets: 1) Select your movie and time, 2) Choose seats, 3) Review order, 4) Complete payment. Your booking confirmation will be sent via email.',
  'booking',
  ARRAY['book', 'tickets', 'select', 'seats'],
  0,
  true,
  now()
FROM languages WHERE code = 'en'
ON CONFLICT DO NOTHING;

INSERT INTO faq_articles (id, language_id, question, answer, category, keywords, helpful_count, is_published, created_at)
SELECT 
  gen_random_uuid(),
  id,
  'How do I cancel my booking?',
  'You can cancel your booking up to 2 hours before the show time. Go to "My Bookings", select your booking, and click "Cancel". Refunds are processed within 3-5 business days.',
  'cancellation',
  ARRAY['cancel', 'refund', 'money', 'back'],
  0,
  true,
  now()
FROM languages WHERE code = 'en'
ON CONFLICT DO NOTHING;

-- Payment FAQs (English)
INSERT INTO faq_articles (id, language_id, question, answer, category, keywords, helpful_count, is_published, created_at)
SELECT 
  gen_random_uuid(),
  id,
  'What payment methods do you accept?',
  'We accept Razorpay, PayPal, Google Pay, and Apple Pay. All payments are securely processed and you receive instant confirmation.',
  'payment',
  ARRAY['payment', 'methods', 'accept', 'credit', 'debit'],
  0,
  true,
  now()
FROM languages WHERE code = 'en'
ON CONFLICT DO NOTHING;

-- General FAQs (English)
INSERT INTO faq_articles (id, language_id, question, answer, category, keywords, helpful_count, is_published, created_at)
SELECT 
  gen_random_uuid(),
  id,
  'Do you offer group discounts?',
  'Yes! Book 5+ tickets and get automatic discounts: 5-9 tickets (5% off), 10-19 tickets (10% off), 20+ tickets (15% off).',
  'general',
  ARRAY['discount', 'group', 'offer', 'save'],
  0,
  true,
  now()
FROM languages WHERE code = 'en'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 5: PROMO CODES SETUP
-- ============================================================================

-- Create sample promo codes
INSERT INTO promo_codes (id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, max_discount, description, is_active, created_at)
VALUES
  -- Summer Campaign
  (gen_random_uuid(), 'SUMMER20', 'percentage', 20, 500, 0, '2024-06-01'::date, '2024-08-31'::date, 500, '20% off on summer movies', true, now()),
  
  -- Monsoon Campaign
  (gen_random_uuid(), 'MONSOON15', 'percentage', 15, 1000, 0, '2024-07-01'::date, '2024-09-30'::date, 300, '15% off monsoon special', true, now()),
  
  -- Group Booking Extra
  (gen_random_uuid(), 'GROUPBUY10', 'fixed', 100, 200, 0, '2024-01-01'::date, '2024-12-31'::date, 100, '₹100 off on group bookings', true, now()),
  
  -- First Time User
  (gen_random_uuid(), 'FIRSTBOOK25', 'percentage', 25, 5000, 0, '2024-01-01'::date, '2024-12-31'::date, 200, '25% off for first booking', true, now()),
  
  -- Weekend Special
  (gen_random_uuid(), 'WEEKEND50', 'fixed', 50, 300, 0, '2024-06-01'::date, '2024-12-31'::date, 50, '₹50 off on weekend bookings', true, now())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SECTION 6: FRAUD DETECTION RULES SETUP
-- ============================================================================

INSERT INTO fraud_detection_rules (id, rule_name, rule_type, rule_config, severity, is_active, created_at)
VALUES
  -- Velocity Detection
  (gen_random_uuid(), 'High Booking Velocity', 'velocity', '{"threshold_bookings": 5, "time_window_minutes": 60, "risk_score": 0.3}', 'high', true, now()),
  
  -- Amount Detection
  (gen_random_uuid(), 'Unusual Amount', 'amount', '{"multiplier": 3, "risk_score": 0.15}', 'medium', true, now()),
  
  -- Location Detection
  (gen_random_uuid(), 'Location Anomaly', 'location', '{"max_distance_km": 500, "risk_score": 0.1}', 'low', true, now()),
  
  -- Payment Pattern
  (gen_random_uuid(), 'Payment Method Variation', 'payment_pattern', '{"max_different_methods": 3, "risk_score": 0.2}', 'medium', true, now()),
  
  -- Account Age
  (gen_random_uuid(), 'New Account Activity', 'account_age', '{"max_days": 7, "max_bookings": 5, "risk_score": 0.25}', 'high', true, now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 7: GROUP BOOKING DISCOUNT TIERS
-- ============================================================================
-- These are handled programmatically in the API:
-- 5-9 tickets: 5% discount
-- 10-19 tickets: 10% discount
-- 20+ tickets: 15% discount
-- (No database entry needed, logic is in the API route)

-- ============================================================================
-- SECTION 8: PRICE HISTORY SAMPLE DATA
-- ============================================================================
-- This is automatically populated by a background job that:
-- 1. Runs hourly
-- 2. Queries current showtime prices
-- 3. Calculates occupancy percentage
-- 4. Inserts historical record

-- For manual testing, insert sample data:
-- INSERT INTO price_history (id, showtime_id, price, occupancy_percentage, recorded_at)
-- SELECT 
--   gen_random_uuid(),
--   (SELECT id FROM showtimes LIMIT 1),
--   FLOOR(RANDOM() * 200 + 250),  -- Random price between 250-450
--   FLOOR(RANDOM() * 100),         -- Random occupancy 0-100%
--   now() - interval '1 day' * (n)
-- FROM generate_series(1, 30) n;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify payment gateways loaded
SELECT 'Payment Gateways' as section, COUNT(*) as count FROM payment_gateways;

-- Verify email templates loaded
SELECT 'Email Templates' as section, COUNT(*) as count FROM email_templates;

-- Verify languages loaded
SELECT 'Languages' as section, COUNT(*) as count FROM languages;

-- Verify translations loaded
SELECT 'Translations' as section, COUNT(*) as count FROM translations;

-- Verify FAQ articles loaded
SELECT 'FAQ Articles' as section, COUNT(*) as count FROM faq_articles;

-- Verify promo codes loaded
SELECT 'Promo Codes' as section, COUNT(*) as count FROM promo_codes WHERE is_active = true;

-- Verify fraud rules loaded
SELECT 'Fraud Rules' as section, COUNT(*) as count FROM fraud_detection_rules WHERE is_active = true;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this script in your Supabase SQL editor
-- 2. Verify all sections loaded successfully using verification queries
-- 3. Update environment variables with actual API keys:
--    - RAZORPAY_KEY_ID
--    - RAZORPAY_KEY_SECRET
--    - SMTP_* credentials
-- 4. Test each feature:
--    - Payment: /api/payments
--    - Promo Codes: /api/promo-codes
--    - Email: /api/email-notifications
--    - Chatbot: /api/chatbot
--    - Translations: /api/translations
--    - Price Alerts: /api/price-alerts
--    - Fraud: /api/fraud-detection
--    - Group: /api/group-bookings
