-- Migration: Production readiness fixes
-- Adds constraints, indexes, and fixes for trivia, affiliate, cosmetics, trivia_streaks

-- 1. Trivia attempts unique constraint (prevents duplicate submissions and farming)
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_attempts_user_question_day
  ON trivia_attempts (user_id, question_id, (answered_at::date));

-- 2. Trivia questions unique per date_key + movie_id to prevent thundering herd
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_questions_date_movie
  ON trivia_questions (date_key, movie_id);

-- 3. Affiliate referrals: prevent multiple referrals per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_affiliate_referrals_referred_id
  ON affiliate_referrals (referred_id)
  WHERE referred_id IS NOT NULL;

-- 4. Indexes for affiliate lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_referrer_status
  ON affiliate_referrals (referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referred_status
  ON affiliate_referrals (referred_id, status);

-- 5. Trivia leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_trivia_attempts_points
  ON trivia_attempts (points_awarded DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_attempts_user_game
  ON trivia_attempts (user_id, game_type, answered_at);

-- 6. Cosmetics: check constraint for non-negative coins
ALTER TABLE users ADD CONSTRAINT chk_users_coins_nonneg
  CHECK (COALESCE(coins, 0) >= 0);

-- 7. Trivia streak date logic fix: ensure date_key uses UTC
-- Add comment to document UTC usage
COMMENT ON COLUMN trivia_streaks.last_date IS 'ISO date string (YYYY-MM-DD) in UTC';

-- 9. Add plan snapshot to affiliate_referrals for audit
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS plan VARCHAR(20);

-- 10. Add last_date index for trivia_streaks
CREATE INDEX IF NOT EXISTS idx_trivia_streaks_last_date ON trivia_streaks (last_date);

-- 11. Add check constraint for trivia_attempts points_awarded
ALTER TABLE trivia_attempts ADD CONSTRAINT chk_trivia_points_nonneg
  CHECK (points_awarded >= 0);

-- 12. Add last_date to trivia_streaks if not exists (already exists but ensure)
-- Already exists: last_date VARCHAR(10)

-- 13. Trivia questions: add index for guess game type
CREATE INDEX IF NOT EXISTS idx_trivia_questions_game_type
  ON trivia_questions (game_type);

-- 14. Add UNIQUE constraint for guess game per user per question
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_attempts_user_question_guess
  ON trivia_attempts (user_id, question_id)
  WHERE game_type = 'guess';

-- 14. Add index for cosmetics lookups
CREATE INDEX IF NOT EXISTS idx_cosmetics_active_price
  ON cosmetics (active, price) WHERE active = TRUE;

-- 15. Add index for user_cosmetics lookups
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user_equipped
  ON user_cosmetics (user_id, equipped) WHERE equipped = TRUE;