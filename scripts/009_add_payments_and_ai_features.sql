-- Payment Gateway Features
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'razorpay', 'paypal', 'google_pay', 'apple_pay'
  is_active BOOLEAN DEFAULT true,
  api_key TEXT NOT NULL ENCRYPTED,
  api_secret TEXT NOT NULL ENCRYPTED,
  webhook_secret TEXT ENCRYPTED,
  fee_percentage DECIMAL(5, 2) DEFAULT 0,
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  supported_currencies TEXT[] DEFAULT ARRAY['INR'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  gateway_id UUID NOT NULL REFERENCES payment_gateways(id),
  gateway_transaction_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  payment_method TEXT, -- card, upi, wallet, net_banking, etc
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Bookings & Discounts
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  group_size INTEGER NOT NULL CHECK (group_size >= 2),
  discount_percentage DECIMAL(5, 2) NOT NULL,
  discount_amount DECIMAL(10, 2),
  original_total DECIMAL(10, 2),
  final_total DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotional Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_booking_amount DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_to TEXT[], -- ['all', 'movies', 'theaters', 'showtimes'] or specific IDs
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES bookings(id),
  amount_saved DECIMAL(10, 2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Notifications
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  template_html TEXT NOT NULL,
  template_text TEXT,
  variables TEXT[], -- array of variable names like ['user_name', 'booking_id']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  template_name TEXT,
  subject TEXT,
  body TEXT,
  variables JSONB,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, bounced
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-language Support
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 'en', 'te', 'ta', 'kn', 'hi', 'ml'
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  direction TEXT DEFAULT 'ltr', -- ltr or rtl
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  translation_key TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  context TEXT, -- 'ui', 'email', 'sms', 'error'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language_id, translation_key, context)
);

CREATE TABLE IF NOT EXISTS user_language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language_id UUID NOT NULL REFERENCES languages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chatbot Support
CREATE TABLE IF NOT EXISTS faq_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  language_id UUID REFERENCES languages(id),
  category TEXT, -- 'booking', 'payment', 'cancellation', 'general'
  keywords TEXT[], -- for search
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'active', -- active, resolved, escalated
  escalated_to_agent_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Prediction
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  occupancy_percentage INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_drop_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id),
  theater_id UUID REFERENCES theaters(id),
  target_price DECIMAL(10, 2),
  status TEXT DEFAULT 'active', -- active, triggered, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);

-- Fraud Detection
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT, -- 'booking_pattern', 'payment_pattern', 'velocity'
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  severity TEXT, -- 'low', 'medium', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  alert_type TEXT,
  risk_score DECIMAL(3, 2), -- 0.0 to 1.0
  rule_id UUID REFERENCES fraud_detection_rules(id),
  details JSONB,
  status TEXT DEFAULT 'pending', -- pending, reviewed, blocked, approved
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_drop_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "payments_user_access" ON payments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "group_bookings_access" ON group_bookings FOR SELECT USING (true);
CREATE POLICY "promo_codes_public_read" ON promo_codes FOR SELECT USING (is_active = true AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE);
CREATE POLICY "promo_usage_user_access" ON promo_code_usage FOR ALL USING (user_id = auth.uid());
CREATE POLICY "email_notifications_user_access" ON email_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "languages_public_read" ON languages FOR SELECT USING (true);
CREATE POLICY "translations_public_read" ON translations FOR SELECT USING (true);
CREATE POLICY "user_language_preferences" ON user_language_preferences FOR ALL USING (user_id = auth.uid());
CREATE POLICY "faq_published_read" ON faq_articles FOR SELECT USING (is_published = true);
CREATE POLICY "chatbot_user_access" ON chatbot_conversations FOR ALL USING (user_id = auth.uid() OR escalated_to_agent_id = auth.uid());
CREATE POLICY "price_drop_alerts_user_access" ON price_drop_alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "fraud_alerts_admin_access" ON fraud_alerts FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- Create Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_gateway_id ON payments(gateway_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_promo_code_usage_user_id ON promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_code_id ON promo_code_usage(promo_code_id);
CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_translations_language_id ON translations(language_id);
CREATE INDEX idx_translations_key ON translations(translation_key);
CREATE INDEX idx_chatbot_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_status ON chatbot_conversations(status);
CREATE INDEX idx_price_history_showtime_id ON price_history(showtime_id);
CREATE INDEX idx_price_drop_alerts_user_id ON price_drop_alerts(user_id);
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
