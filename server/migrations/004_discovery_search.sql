-- 004_discovery_search.sql
-- Spotify-style search & discovery engine.
-- Mirrors the discovery block in config/schema.sql (idempotent; safe to run
-- standalone against environments where schema.sql already applied it).

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm unavailable, discovery search falls back to ILIKE';
END $$;

ALTER TABLE uploads ADD COLUMN IF NOT EXISTS format VARCHAR(10) DEFAULT 'LONG';
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_format_check;
ALTER TABLE uploads ADD CONSTRAINT uploads_format_check CHECK (format IN ('SHORT', 'LONG'));

UPDATE uploads SET format = 'SHORT'
WHERE duration_seconds > 0 AND duration_seconds < 2400 AND format IS DISTINCT FROM 'SHORT';

UPDATE uploads SET tags = to_jsonb(
  ARRAY[LOWER(REGEXP_REPLACE(COALESCE(genre, ''), '[^a-zA-Z0-9]+', '-', 'g'))]
)
WHERE (genre IS NOT NULL AND genre <> '')
  AND (tags IS NULL OR tags = '[]'::jsonb);

CREATE TABLE IF NOT EXISTS movie_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('DIRECTED_BY', 'ACTED_IN')),
  character_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (movie_id, creator_id, role)
);

CREATE INDEX IF NOT EXISTS idx_movie_creators_creator ON movie_creators (creator_id);
CREATE INDEX IF NOT EXISTS idx_movie_creators_movie ON movie_creators (movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_creators_role ON movie_creators (role);

INSERT INTO movie_creators (movie_id, creator_id, role)
SELECT u.id, u.user_id, 'DIRECTED_BY'
FROM uploads u
WHERE u.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION sync_movie_creator_director() RETURNS trigger AS $$
BEGIN
  INSERT INTO movie_creators (movie_id, creator_id, role)
  VALUES (NEW.id, NEW.user_id, 'DIRECTED_BY')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uploads_director ON uploads;
CREATE TRIGGER trg_uploads_director
AFTER INSERT ON uploads
FOR EACH ROW EXECUTE FUNCTION sync_movie_creator_director();

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_uploads_title_trgm ON uploads USING gin (title gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_uploads_status_title ON uploads (status, title);
CREATE INDEX IF NOT EXISTS idx_uploads_tags ON uploads USING gin (tags);
