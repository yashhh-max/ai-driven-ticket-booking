# ============================================================================
# PAYMENT GATEWAY CONFIGURATION
# ============================================================================

# Razorpay (Primary Payment Gateway)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# PayPal (Future Integration)
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_MODE=sandbox  # Set to 'live' for production

# Google Pay (Future Integration)
GOOGLE_PAY_MERCHANT_ID=xxxxxxxxxxxxxxxxxxxxx
GOOGLE_PAY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Apple Pay (Future Integration)
APPLE_PAY_MERCHANT_ID=merchant.com.cinemabook
APPLE_PAY_CERTIFICATE_PATH=/path/to/cert.p8

# ============================================================================
# EMAIL NOTIFICATION CONFIGURATION
# ============================================================================

# SMTP Configuration (for Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@cinemabook.in
SMTP_FROM_NAME=Cinema Booking

# Alternative SMTP Providers:
# SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx

# Mailgun
# SMTP_HOST=smtp.mailgun.org
# SMTP_PORT=587
# SMTP_USER=postmaster@mail.cinemabook.in
# SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxx

# AWS SES
# SMTP_HOST=email-smtp.region.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=xxxxxxxxxxxxxxxxxxxxxxxx
# SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Supabase (Already configured, but including for reference)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# LANGUAGE & INTERNATIONALIZATION
# ============================================================================

# Default Language
DEFAULT_LANGUAGE=en

# Supported Languages (comma-separated)
SUPPORTED_LANGUAGES=en,te,ta,kn,hi,ml

# Timezone (for email scheduling)
TIMEZONE=Asia/Kolkata

# ============================================================================
# FRAUD DETECTION CONFIGURATION
# ============================================================================

# Fraud Detection Settings
FRAUD_RISK_THRESHOLD=0.3  # Risk score threshold (0.0-1.0)
FRAUD_BLOCK_THRESHOLD=0.7  # Risk score threshold for automatic blocking

# Velocity Check Settings
FRAUD_MAX_BOOKINGS_PER_HOUR=5
FRAUD_MAX_PAYMENT_METHODS_RECENT=3

# Amount Detection Settings
FRAUD_UNUSUAL_AMOUNT_MULTIPLIER=3  # Alert if amount > avg * this multiplier

# Location Check Settings
FRAUD_MAX_LOCATION_DISTANCE_KM=500  # Alert if > distance from last location

# ============================================================================
# PRICE PREDICTION CONFIGURATION
# ============================================================================

# Price History Settings
PRICE_HISTORY_DAYS=30  # Days of history to analyze for predictions
PRICE_TREND_MIN_DATA_POINTS=2  # Minimum points needed for trend analysis

# Price Alert Settings
PRICE_CHECK_INTERVAL_HOURS=6  # How often to check for price drops
PRICE_ALERT_BATCH_SIZE=100  # Number of alerts to process per batch

# ============================================================================
# CHATBOT CONFIGURATION
# ============================================================================

# FAQ Settings
CHATBOT_MATCH_THRESHOLD=0.5  # Minimum similarity score for FAQ matching (0.0-1.0)
CHATBOT_MAX_HISTORY_MESSAGES=50  # Max messages to keep in conversation history

# Escalation Settings
CHATBOT_ESCALATION_TIMEOUT_MINUTES=30  # Time before auto-escalation
CHATBOT_SUPPORT_TEAM_EMAIL=support@cinemabook.in

# Optional: AI/ML Enhancements
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx  # For semantic similarity
# HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx  # For embeddings

# ============================================================================
# GROUP BOOKING CONFIGURATION
# ============================================================================

# Group Booking Settings
GROUP_BOOKING_MIN_TICKETS=5  # Minimum tickets for group discount
GROUP_BOOKING_DISCOUNT_TIERS=5:5,10:10,20:15  # tickets:discount%

# ============================================================================
# LOGGING & MONITORING
# ============================================================================

# Application Environment
NODE_ENV=production  # development, staging, production

# Logging
LOG_LEVEL=info  # error, warn, info, debug
LOG_FORMAT=json  # json, text

# Optional: Error Tracking (Sentry)
# SENTRY_DSN=https://xxxxxxx@sentry.io/xxxxxxx

# Optional: Analytics
# MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
# GOOGLE_ANALYTICS_ID=G-XXXXXXXXXXXXXXXX

# ============================================================================
# API RATE LIMITING
# ============================================================================

# Rate Limit Settings (requests per minute)
API_RATE_LIMIT_GENERAL=60
API_RATE_LIMIT_AUTH=10
API_RATE_LIMIT_PAYMENTS=30
API_RATE_LIMIT_CHATBOT=20

# ============================================================================
# REDIS CACHE (Optional but Recommended for Production)
# ============================================================================

# Redis Configuration (for caching translations, FAQs, etc.)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional-password
CACHE_TTL_TRANSLATIONS=86400  # 1 day
CACHE_TTL_FAQ=86400  # 1 day
CACHE_TTL_FRAUD_PATTERNS=300  # 5 minutes

# ============================================================================
# WEBHOOK CONFIGURATION
# ============================================================================

# Razorpay Webhook
RAZORPAY_WEBHOOK_URL=https://yourdomain.com/api/webhooks/razorpay

# Price Drop Alert Webhook (if using external service)
PRICE_ALERT_WEBHOOK_URL=https://yourdomain.com/api/webhooks/price-alerts

# ============================================================================
# SECURITY
# ============================================================================

# JWT Secret (if using custom JWT, usually handled by Supabase)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=your-32-character-hex-encryption-key

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Enable/Disable Features
FEATURE_PAYMENT_GATEWAY_ENABLED=true
FEATURE_GROUP_BOOKING_ENABLED=true
FEATURE_PROMO_CODES_ENABLED=true
FEATURE_EMAIL_NOTIFICATIONS_ENABLED=true
FEATURE_MULTI_LANGUAGE_ENABLED=true
FEATURE_CHATBOT_ENABLED=true
FEATURE_PRICE_ALERTS_ENABLED=true
FEATURE_FRAUD_DETECTION_ENABLED=true

# ============================================================================
# ADMIN SETTINGS
# ============================================================================

# Admin Email
ADMIN_EMAIL=admin@cinemabook.in

# Admin Features
ADMIN_FRAUD_ALERT_EMAIL=fraud-alerts@cinemabook.in
ADMIN_PAYMENT_ALERT_EMAIL=payments@cinemabook.in

# ============================================================================
# DEPLOYMENT
# ============================================================================

# Vercel (if using Vercel)
VERCEL_ENV=production
VERCEL_URL=https://yourdomain.com

# ============================================================================
# NOTES & SETUP INSTRUCTIONS
# ============================================================================

# 1. RAZORPAY SETUP:
#    - Go to https://dashboard.razorpay.com/
#    - Navigate to Settings > API Keys
#    - Copy Key ID and Key Secret
#    - Create a webhook for payment.authorized and payment.failed
#
# 2. EMAIL SETUP (Gmail):
#    - Enable 2FA on Gmail account
#    - Generate App Password at https://myaccount.google.com/apppasswords
#    - Use App Password as SMTP_PASSWORD
#
# 3. SUPABASE SETUP:
#    - Run migrations: scripts/009_add_payments_and_ai_features.sql
#    - Create payment_gateways record with Razorpay config
#    - Populate email_templates table with default templates
#    - Add FAQ articles to faq_articles table
#    - Add translations to translations table
#
# 4. SECURITY:
#    - Never commit .env to git
#    - Use environment variables in production
#    - Rotate secrets regularly
#    - Enable 2FA on all service accounts
#
# 5. TESTING:
#    - Use Razorpay test keys for development
#    - Test all payment flows before deployment
#    - Verify email delivery with test accounts
#    - Test fraud detection with various scenarios
#
# ============================================================================
