-- Production-Ready Auth System Migration
-- Adds refresh tokens, token blocklist, rate limiting, and account lockout support

-- Step 1: ALTER users table (keep existing table, add missing columns)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();

-- Allow 'viewer' role (used by new auth system)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('viewer', 'user', 'creator', 'admin', 'banned'));

-- Step 2: Refresh tokens table (for token rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- Step 3: Token blocklist (for instant JWT revocation on logout)
CREATE TABLE IF NOT EXISTS token_blocklist (
  token_hash VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_token_blocklist_expiry ON token_blocklist (expires_at);

-- Step 4: Rate limit log (database-backed rate limiting)
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,  -- email or IP address
  action VARCHAR(50) NOT NULL,       -- 'signup-viewer', 'signup-creator', 'login', 'google', etc.
  attempted_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_log (identifier, action, attempted_at);

-- Step 5: Cleanup old rate_limit_log entries (run periodically via cron or server)
-- DELETE FROM rate_limit_log WHERE attempted_at < NOW() - INTERVAL '1 hour';
