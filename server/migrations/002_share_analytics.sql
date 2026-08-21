-- Share Analytics Table
CREATE TABLE IF NOT EXISTS share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'movie',
  platform VARCHAR(50) NOT NULL,
  share_method VARCHAR(50) DEFAULT 'native',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_analytics_content ON share_analytics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_share_analytics_user ON share_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_created ON share_analytics(created_at);

-- Add custom fields to share_links
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS custom_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS custom_description TEXT,
ADD COLUMN IF NOT EXISTS custom_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS utm_params JSONB;

-- Posts table for post system
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls JSONB DEFAULT '[]',
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  text TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(20),
  duration_seconds INT,
  unlock_at TIMESTAMP,
  milestone_unlock VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

-- Post views tracking
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  minutes_watched NUMERIC(10,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user ON post_views(user_id);

-- Share analytics table
CREATE TABLE IF NOT EXISTS share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'movie',
  platform VARCHAR(50) NOT NULL,
  share_method VARCHAR(50) DEFAULT 'native',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_analytics_content ON share_analytics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_share_analytics_user ON share_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_created ON share_analytics(created_at);

-- Add custom fields to share_links
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS custom_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS custom_description TEXT,
ADD COLUMN IF NOT EXISTS custom_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS utm_params JSONB;