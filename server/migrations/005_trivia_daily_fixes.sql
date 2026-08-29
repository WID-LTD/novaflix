-- Migration: 005 — Daily trivia fixes
-- Idempotent mirror of the trivia block appended to config/schema.sql.
-- Root-cause fix: submitDaily uses ON CONFLICT (user_id, question_id, (answered_at::date))
-- which requires ux_trivia_attempts_user_question_day; that index previously shipped
-- only in migrations/001_production_fixes.sql, which no code path executes.

CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_attempts_user_question_day
  ON trivia_attempts (user_id, question_id, (answered_at::date));

CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_questions_date_movie
  ON trivia_questions (date_key, movie_id);

CREATE INDEX IF NOT EXISTS idx_trivia_attempts_points
  ON trivia_attempts (points_awarded DESC);

CREATE INDEX IF NOT EXISTS idx_trivia_attempts_user_game
  ON trivia_attempts (user_id, game_type, answered_at);
