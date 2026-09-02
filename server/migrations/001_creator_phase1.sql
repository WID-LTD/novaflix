-- Phase 1: Creator Platform Foundation
-- Wallet, Claims, PPM, Baseline VPM, Bank Codes Audit

-- 1. Creator claim requests (Persona KYC)
CREATE TABLE IF NOT EXISTS creator_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tmdb_person_id INT NOT NULL,
  display_name VARCHAR(255),
  persona_inquiry_id VARCHAR(255),
  persona_template_id VARCHAR(255),
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied, expired
  kyc_data JSONB,
  claim_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tmdb_person_id)
);

-- 2. Wallet (NGN only, real-time)
ALTER TABLE creator_profiles 
ADD COLUMN IF NOT EXISTS wallet_balance_ngn NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paystack_recipient_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS paystack_verified_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS flutterwave_beneficiary_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS flutterwave_verified_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS paystack_bank_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS paystack_account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS paystack_account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS flutterwave_bank_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS flutterwave_account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS flutterwave_account_name VARCHAR(255);

-- 3. Wallet transactions (unified ledger)
CREATE TABLE IF NOT EXISTS creator_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- 'ppm_upload','ppm_scraped','ppm_youtube','ppm_live','ppm_shorts','tip','gift','membership','withdrawal','refund'
  amount_ngn NUMERIC(14,2) NOT NULL,
  balance_after_ngn NUMERIC(14,2) NOT NULL,
  reference VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_wallet_transactions_creator ON creator_wallet_transactions (creator_id, created_at DESC);

-- 4. PPM tier parameters (platform-controlled)
CREATE TABLE IF NOT EXISTS platform_ppm_tiers (
  tier VARCHAR(20) PRIMARY KEY, -- 'student','basic','standard','premium'
  min_ppm NUMERIC(10,2) NOT NULL,
  max_ppm NUMERIC(10,2) NOT NULL,
  multiplier NUMERIC(3,2) NOT NULL,
  subscription_price_ngn INT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO platform_ppm_tiers (tier, min_ppm, max_ppm, multiplier, subscription_price_ngn) VALUES
('student', 5.00, 100.00, 0.75, 800),
('basic', 5.00, 200.00, 1.00, 1500),
('standard', 10.00, 300.00, 1.25, 2500),
('premium', 20.00, 500.00, 1.50, 5500)
ON CONFLICT (tier) DO UPDATE SET
  min_ppm = EXCLUDED.min_ppm,
  max_ppm = EXCLUDED.max_ppm,
  multiplier = EXCLUDED.multiplier,
  subscription_price_ngn = EXCLUDED.subscription_price_ngn,
  updated_at = NOW();

-- 5. Creator PPM config (creator-set base rate, clamped to tier)
CREATE TABLE IF NOT EXISTS creator_ppm_config (
  creator_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  base_rate NUMERIC(10,2) DEFAULT 10.00,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Baseline VPM cache (hourly refresh)
CREATE TABLE IF NOT EXISTS baseline_vpm_cache (
  content_type VARCHAR(20) PRIMARY KEY, -- 'movie', 'shorts', 'live'
  baseline_vpm NUMERIC(10,4) NOT NULL,
  total_pool_ngn NUMERIC(14,2) NOT NULL,
  total_minutes BIGINT NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO baseline_vpm_cache (content_type, baseline_vpm, total_pool_ngn, total_minutes) VALUES
('movie', 2.0000, 0, 0),
('shorts', 0.2000, 0, 0),
('live', 1.0000, 0, 0)
ON CONFLICT (content_type) DO NOTHING;

-- 7. Bank codes audit log (per-transaction fetch, but log for audit)
CREATE TABLE IF NOT EXISTS bank_codes_audit (
  id SERIAL PRIMARY KEY,
  gateway VARCHAR(20) NOT NULL, -- 'paystack', 'flutterwave'
  country CHAR(2) NOT NULL DEFAULT 'NG',
  bank_code VARCHAR(20) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(20) DEFAULT 'api' -- 'api', 'cache'
);
CREATE INDEX IF NOT EXISTS idx_bank_codes_audit_gateway ON bank_codes_audit (gateway, bank_code);

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_claim_requests_tmdb ON creator_claim_requests (tmdb_person_id);
CREATE INDEX IF NOT EXISTS idx_creator_claim_requests_status ON creator_claim_requests (claim_status, kyc_status);
CREATE INDEX IF NOT EXISTS idx_creator_wallet_transactions_type ON creator_wallet_transactions (type, created_at DESC);

-- 9. Update users table for claimed creator profile link
ALTER TABLE users ADD COLUMN IF NOT EXISTS claimed_creator_profile_id UUID REFERENCES creator_profiles(id) ON DELETE SET NULL;