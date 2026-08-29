-- Migration 003: Plan Enforcement
-- Structured tier limits on plans + download device registry
-- Tier matrix (locked):
--   free:     480p, 1 screen, 0 downloads, ads ON,  6 skips/hr
--   student:  720p, 1 screen, 1 download,  ads ON,  6 skips/hr
--   basic:    720p, 1 screen, 1 download,  ad-free, 6 skips/hr
--   standard: 1080p, 2 screens, 2 downloads, ad-free, unlimited skips
--   premium:  4K+HDR/DV, spatial audio, 4 screens, 6 downloads, ad-free, unlimited skips, premier access

-- 1. Machine-readable limits on plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_resolution_height INT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_concurrent_screens INT DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_download_devices INT DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ad_free BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS hourly_skip_limit INT; -- NULL = unlimited
ALTER TABLE plans ADD COLUMN IF NOT EXISTS spatial_audio BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS hdr_dolby BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS premier_access BOOLEAN DEFAULT false;

-- Free tier has no plans row (unauthenticated/default); limits live in PLAN_FEATURES.
UPDATE plans SET max_resolution_height = 720, max_concurrent_screens = 1, max_download_devices = 1,
  ad_free = false, hourly_skip_limit = 6 WHERE slug = 'student';
UPDATE plans SET max_resolution_height = 720, max_concurrent_screens = 1, max_download_devices = 1,
  ad_free = true, hourly_skip_limit = 6 WHERE slug = 'basic';
UPDATE plans SET max_resolution_height = 1080, max_concurrent_screens = 2, max_download_devices = 2,
  ad_free = true, hourly_skip_limit = NULL WHERE slug = 'standard';
UPDATE plans SET max_resolution_height = 2160, max_concurrent_screens = 4, max_download_devices = 6,
  ad_free = true, hourly_skip_limit = NULL, spatial_audio = true, hdr_dolby = true, premier_access = true
  WHERE slug = 'premium';

-- 2. Download device registry (caps enforced per plan)
CREATE TABLE IF NOT EXISTS download_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(50),
  registered_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_download_devices_user ON download_devices (user_id);

-- 3. Refresh pricing-page copy to match locked matrix
UPDATE plans SET features = '["720p HD quality","All devices supported","1 screen at a time","Offline downloads (1 device)","Ad-supported","6 skips per hour"]'::jsonb WHERE slug = 'student';
UPDATE plans SET features = '["720p HD quality","All devices supported","1 screen at a time","Offline downloads (1 device)","Completely ad-free","6 skips per hour"]'::jsonb WHERE slug = 'basic';
UPDATE plans SET features = '["1080p Full HD","All devices supported","2 screens simultaneously","Offline downloads (2 devices)","Completely ad-free","Unlimited skips"]'::jsonb WHERE slug = 'standard';
UPDATE plans SET features = '["4K Ultra HD + Dolby Vision & HDR10","Spatial Audio support","All devices supported","4 screens simultaneously","Offline downloads (6 devices)","Completely ad-free","Unlimited skips","Premier access: indie theatrical drops, ticketed masterclasses, virtual red carpet lobbies"]'::jsonb WHERE slug = 'premium';
