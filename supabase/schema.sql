-- ============================================================
-- UrbanGist — Complete Supabase Database Schema
-- Run this in Supabase SQL Editor in order
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  slug          TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('artist', 'admin', 'listener')),
  social_links  JSONB DEFAULT '{}',
  -- Social: { instagram, twitter, tiktok, youtube, spotify }
  verified      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TRACKS
-- ============================================================
CREATE TABLE tracks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  genre           TEXT NOT NULL,
  subgenre        TEXT,
  cover_url       TEXT NOT NULL,
  audio_url       TEXT NOT NULL,
  duration_sec    INTEGER,
  description     TEXT,
  lyrics          TEXT,
  release_date    DATE,
  -- SEO fields
  seo_title       TEXT,
  seo_description TEXT,
  -- Status workflow
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'live', 'rejected', 'takedown')),
  rejection_note  TEXT,
  -- Stats (denormalized for performance)
  play_count      BIGINT DEFAULT 0,
  share_count     BIGINT DEFAULT 0,
  like_count      BIGINT DEFAULT 0,
  -- Ranking score (updated by cron / trigger)
  rank_score      FLOAT DEFAULT 0,
  -- Boost multiplier (1.0 = no boost)
  boost_multiplier FLOAT DEFAULT 1.0,
  featured        BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX idx_tracks_status     ON tracks(status);
CREATE INDEX idx_tracks_artist_id  ON tracks(artist_id);
CREATE INDEX idx_tracks_slug       ON tracks(slug);
CREATE INDEX idx_tracks_rank_score ON tracks(rank_score DESC);
CREATE INDEX idx_tracks_genre      ON tracks(genre);

-- ============================================================
-- 3. TRACK EVENTS (Analytics)
-- ============================================================
CREATE TABLE track_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id     UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL CHECK (event_type IN ('play', 'share', 'like', 'download')),
  source       TEXT DEFAULT 'direct' CHECK (source IN ('direct','whatsapp','instagram','tiktok','twitter','qr','other')),
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id   TEXT,
  ip_hash      TEXT,  -- hashed for privacy
  country_code TEXT,
  completed    BOOLEAN DEFAULT FALSE,  -- for play completion tracking
  progress_pct INTEGER DEFAULT 0,     -- 0-100
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_track_id   ON track_events(track_id);
CREATE INDEX idx_events_type       ON track_events(event_type);
CREATE INDEX idx_events_created_at ON track_events(created_at DESC);

-- ============================================================
-- 4. LIKES (many-to-many user ↔ track)
-- ============================================================
CREATE TABLE likes (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  track_id   UUID REFERENCES tracks(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

-- ============================================================
-- 5. PROMOTIONS / BOOSTS
-- ============================================================
CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id        UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  artist_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('basic','standard','premium')),
  amount_ngn      INTEGER NOT NULL,
  boost_multiplier FLOAT NOT NULL DEFAULT 2.0,
  duration_hours  INTEGER NOT NULL,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','expired','cancelled','failed')),
  -- Paystack fields
  paystack_ref    TEXT UNIQUE,
  paystack_txn_id TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_track_id   ON promotions(track_id);
CREATE INDEX idx_promotions_status     ON promotions(status);
CREATE INDEX idx_promotions_end_date   ON promotions(end_date);

-- ============================================================
-- 6. ARTICLES (Learn on UrbanGist / Blog)
-- ============================================================
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL,  -- rich HTML from TipTap
  cover_url       TEXT,
  category        TEXT NOT NULL DEFAULT 'guide'
                  CHECK (category IN ('guide','platform','industry','news','tutorial')),
  tags            TEXT[] DEFAULT '{}',
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  og_image        TEXT,
  -- Status
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','archived')),
  featured        BOOLEAN DEFAULT FALSE,
  -- Stats
  view_count      BIGINT DEFAULT 0,
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX idx_articles_status     ON articles(status);
CREATE INDEX idx_articles_slug       ON articles(slug);
CREATE INDEX idx_articles_category   ON articles(category);
CREATE INDEX idx_articles_published  ON articles(published_at DESC);

-- ============================================================
-- 7. FOLLOWS (listeners follow artists)
-- ============================================================
CREATE TABLE follows (
  follower_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ============================================================
-- 9. PLATFORM SETTINGS (key-value store for admin)
-- ============================================================
CREATE TABLE platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert defaults
INSERT INTO platform_settings (key, value) VALUES
  ('boost_plans', '{"basic":{"price":1000,"hours":24,"multiplier":2.0},"standard":{"price":3000,"hours":72,"multiplier":3.5},"premium":{"price":5000,"hours":168,"multiplier":6.0}}'),
  ('featured_genres', '["Afrobeats","Afrorap","Amapiano","Gospel","Afropop","Highlife","Fuji"]'),
  ('site_announcement', '{"text":"","active":false}');

-- ============================================================
-- 10. RANKING SCORE FUNCTION
-- Score = (P * 1.0 + S * 3.0 + L * 2.0) * time_decay * boost
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_rank_score(
  p_track_id UUID
) RETURNS FLOAT AS $$
DECLARE
  v_plays    BIGINT;
  v_shares   BIGINT;
  v_likes    BIGINT;
  v_age_hrs  FLOAT;
  v_boost    FLOAT;
  v_score    FLOAT;
BEGIN
  SELECT play_count, share_count, like_count, boost_multiplier,
         EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 3600
  INTO v_plays, v_shares, v_likes, v_boost, v_age_hrs
  FROM tracks WHERE id = p_track_id;

  -- Time decay: score halves every 72 hours
  v_score := (v_plays * 1.0 + v_shares * 3.0 + v_likes * 2.0)
             * EXP(-0.693 * v_age_hrs / 72.0)
             * v_boost;

  RETURN GREATEST(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. TRIGGER: Update rank_score on stat change
-- ============================================================
CREATE OR REPLACE FUNCTION update_track_rank_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank_score := calculate_rank_score(NEW.id);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rank_score
  BEFORE UPDATE OF play_count, share_count, like_count, boost_multiplier
  ON tracks FOR EACH ROW
  EXECUTE FUNCTION update_track_rank_score();

-- ============================================================
-- 12. TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Build slug from email prefix
  base_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO profiles (id, username, slug, display_name)
  VALUES (
    NEW.id,
    final_slug,
    final_slug,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- TRACKS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live tracks are public"        ON tracks FOR SELECT USING (status = 'live' OR auth.uid() = artist_id);
CREATE POLICY "Artists can insert own tracks" ON tracks FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can update own tracks" ON tracks FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "Admin can manage all tracks"   ON tracks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TRACK EVENTS
ALTER TABLE track_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON track_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Artists can view own track events" ON track_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM tracks t WHERE t.id = track_id AND t.artist_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- LIKES
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Likes are publicly viewable" ON likes FOR SELECT USING (true);

-- PROMOTIONS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists can view own promotions" ON promotions FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "Artists can insert own promotions" ON promotions FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Admin can manage promotions" ON promotions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ARTICLES
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON articles FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "Admin can manage articles" ON articles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 14. STORAGE BUCKETS (Run via Supabase Dashboard or CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('track-covers', 'track-covers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('track-audio', 'track-audio', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

-- Storage RLS:
-- CREATE POLICY "Public read covers"  ON storage.objects FOR SELECT USING (bucket_id = 'track-covers');
-- CREATE POLICY "Auth upload covers"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'track-covers' AND auth.role() = 'authenticated');
-- (Repeat for track-audio and article-images)

-- ============================================================
-- 15. HELPFUL VIEWS
-- ============================================================

-- Live tracks with artist info (used in discovery feed)
CREATE VIEW v_live_tracks AS
  SELECT
    t.*,
    p.display_name  AS artist_name,
    p.slug          AS artist_slug,
    p.avatar_url    AS artist_avatar,
    p.verified      AS artist_verified
  FROM tracks t
  JOIN profiles p ON p.id = t.artist_id
  WHERE t.status = 'live'
  ORDER BY t.rank_score DESC;

-- Track analytics summary
CREATE VIEW v_track_analytics AS
  SELECT
    track_id,
    COUNT(*) FILTER (WHERE event_type = 'play')  AS total_plays,
    COUNT(*) FILTER (WHERE event_type = 'share') AS total_shares,
    COUNT(*) FILTER (WHERE event_type = 'like')  AS total_likes,
    COUNT(*) FILTER (WHERE event_type = 'play' AND completed = TRUE) AS completed_plays,
    ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'play' AND completed = TRUE)
          / NULLIF(COUNT(*) FILTER (WHERE event_type = 'play'), 0), 1) AS completion_rate,
    -- Source breakdown
    COUNT(*) FILTER (WHERE source = 'whatsapp')   AS from_whatsapp,
    COUNT(*) FILTER (WHERE source = 'instagram')  AS from_instagram,
    COUNT(*) FILTER (WHERE source = 'tiktok')     AS from_tiktok,
    COUNT(*) FILTER (WHERE source = 'qr')         AS from_qr,
    MIN(created_at) AS first_event,
    MAX(created_at) AS last_event
  FROM track_events
  GROUP BY track_id;

-- ============================================================
-- 16. CRON JOB (Supabase pg_cron — enable in dashboard)
-- ============================================================
-- Recalculate rank scores every 30 minutes
-- SELECT cron.schedule('recalc-rank', '*/30 * * * *', $$
--   UPDATE tracks
--   SET rank_score = calculate_rank_score(id)
--   WHERE status = 'live'
-- $$);

-- Expire finished promotions every 5 minutes
-- SELECT cron.schedule('expire-promotions', '*/5 * * * *', $$
--   UPDATE promotions SET status = 'expired'
--   WHERE status = 'active' AND end_date < NOW();
--   UPDATE tracks t SET boost_multiplier = 1.0
--   WHERE NOT EXISTS (
--     SELECT 1 FROM promotions p
--     WHERE p.track_id = t.id AND p.status = 'active' AND p.end_date > NOW()
--   ) AND boost_multiplier > 1.0;
-- $$);
