-- =============================================
-- AI/ML MATCHING SYSTEM - PHASE 1: DATA INFRASTRUCTURE
-- =============================================

-- Enable pgvector extension for semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. USER INTERACTION EVENTS TABLE
-- Captures all implicit and explicit behavioral signals
-- =============================================
CREATE TABLE public.user_interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_user_id UUID,
  event_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'profile_view', 'profile_expand', 'dwell_time', 'scroll_past',
    'skip', 'save', 'follow', 'unfollow',
    'message_sent', 'message_replied', 'message_read',
    'meeting_requested', 'meeting_accepted', 'meeting_declined',
    'contact_exchanged', 'profile_shared',
    'session_bookmark', 'session_attended', 'qa_asked'
  ))
);

-- Indexes for efficient querying
CREATE INDEX idx_interaction_user_type_time 
  ON user_interaction_events(user_id, event_type, created_at DESC);
CREATE INDEX idx_interaction_target_type 
  ON user_interaction_events(target_user_id, event_type) 
  WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_interaction_event_context 
  ON user_interaction_events(event_id, event_type) 
  WHERE event_id IS NOT NULL;
CREATE INDEX idx_interaction_created 
  ON user_interaction_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_interaction_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own interactions"
  ON public.user_interaction_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions"
  ON public.user_interaction_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 2. PROFILE ENGAGEMENT SCORES TABLE
-- Aggregated metrics for ranking and discovery
-- =============================================
CREATE TABLE public.profile_engagement_scores (
  user_id UUID PRIMARY KEY,
  
  -- Inbound metrics (how others engage with this profile)
  views_7d INT DEFAULT 0,
  views_30d INT DEFAULT 0,
  saves_7d INT DEFAULT 0,
  saves_30d INT DEFAULT 0,
  follows_7d INT DEFAULT 0,
  follows_30d INT DEFAULT 0,
  messages_received_7d INT DEFAULT 0,
  messages_received_30d INT DEFAULT 0,
  meetings_received_7d INT DEFAULT 0,
  
  -- Outbound metrics (how this user engages)
  swipes_7d INT DEFAULT 0,
  follows_sent_7d INT DEFAULT 0,
  messages_sent_7d INT DEFAULT 0,
  response_rate FLOAT DEFAULT 0.5,
  avg_response_time_seconds INT,
  
  -- Derived scores (0.0 to 1.0)
  desirability_score FLOAT DEFAULT 0.5,
  activity_score FLOAT DEFAULT 0.5,
  quality_score FLOAT DEFAULT 0.5,
  engagement_velocity FLOAT DEFAULT 0.0, -- rate of change
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_engagement_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for users, service role updates)
CREATE POLICY "Users can view any engagement scores"
  ON public.profile_engagement_scores FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 3. PROFILE EMBEDDINGS TABLE
-- Semantic embeddings for AI-powered matching
-- =============================================
CREATE TABLE public.profile_embeddings (
  user_id UUID PRIMARY KEY,
  
  -- Text embeddings (768-dim from Gemini/Lovable AI)
  bio_embedding vector(768),
  skills_embedding vector(768),
  interests_embedding vector(768),
  goals_embedding vector(768),
  
  -- Combined user tower embedding (compressed for fast ANN)
  user_embedding vector(128),
  
  -- Metadata
  embedding_version INT DEFAULT 1,
  source_hash TEXT, -- hash of source data for invalidation
  last_updated TIMESTAMPTZ DEFAULT now(),
  
  -- Quality flags
  is_complete BOOLEAN DEFAULT false,
  quality_score FLOAT DEFAULT 0.0
);

-- ANN indexes for fast similarity search
CREATE INDEX idx_user_embedding_ann 
  ON profile_embeddings 
  USING ivfflat (user_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX idx_bio_embedding_ann 
  ON profile_embeddings 
  USING ivfflat (bio_embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view any embeddings for matching"
  ON public.profile_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 4. USER SESSION INTERESTS TABLE
-- Track session-level engagement for Zone matching
-- =============================================
CREATE TABLE public.user_session_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  session_id UUID,
  
  interest_type TEXT NOT NULL,
  track_id UUID,
  speaker_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_interest_type CHECK (interest_type IN (
    'bookmarked', 'attended', 'asked_question', 
    'downloaded', 'rated', 'shared'
  )),
  CONSTRAINT unique_user_session_interest UNIQUE (user_id, session_id, interest_type)
);

-- Indexes
CREATE INDEX idx_session_interest_user 
  ON user_session_interests(user_id, event_id);
CREATE INDEX idx_session_interest_session 
  ON user_session_interests(session_id) 
  WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_session_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own session interests"
  ON public.user_session_interests FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view others session interests for matching"
  ON public.user_session_interests FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 5. AI MATCH INSIGHTS CACHE TABLE
-- Cached AI-generated match narratives
-- =============================================
CREATE TABLE public.ai_match_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  
  -- AI-generated content
  match_score INT NOT NULL,
  match_narrative TEXT,
  match_category TEXT, -- 'professional', 'social', 'goal', 'complementary'
  conversation_starters TEXT[],
  collaboration_ideas TEXT[],
  shared_context JSONB DEFAULT '{}',
  
  -- Cache metadata
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  model_version TEXT DEFAULT 'v1',
  
  CONSTRAINT unique_user_pair UNIQUE (user_id, target_user_id)
);

-- Index for cache lookups
CREATE INDEX idx_match_insights_lookup 
  ON ai_match_insights(user_id, target_user_id);
CREATE INDEX idx_match_insights_expiry 
  ON ai_match_insights(expires_at);

-- Enable RLS
ALTER TABLE public.ai_match_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own match insights"
  ON public.ai_match_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 6. INTERACTION SIGNAL WEIGHTS CONFIG TABLE
-- Configurable weights for ML scoring
-- =============================================
CREATE TABLE public.ml_signal_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_name TEXT NOT NULL UNIQUE,
  
  -- Weights by context
  pulse_weight FLOAT NOT NULL DEFAULT 1.0,
  zone_weight FLOAT NOT NULL DEFAULT 1.0,
  
  -- Temporal decay
  decay_half_life_days INT DEFAULT 30,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default signal weights
INSERT INTO public.ml_signal_weights (signal_name, pulse_weight, zone_weight, decay_half_life_days, description) VALUES
  ('contact_exchanged', 100, 100, 180, 'Exchanged contact information'),
  ('meeting_accepted', 80, 90, 90, 'Accepted meeting request'),
  ('meeting_requested', 40, 50, 60, 'Sent meeting request'),
  ('message_replied', 60, 50, 60, 'Replied to message'),
  ('message_sent', 40, 30, 30, 'Initiated conversation'),
  ('follow', 30, 25, 60, 'Followed user'),
  ('save', 25, 20, 30, 'Saved profile'),
  ('profile_expand', 10, 10, 7, 'Expanded profile details'),
  ('dwell_time_high', 8, 8, 3, 'Spent >10s on profile'),
  ('dwell_time_medium', 4, 4, 3, 'Spent 5-10s on profile'),
  ('session_overlap', 0, 15, 7, 'Attended same session'),
  ('circle_overlap', 10, 12, 30, 'Member of same circle'),
  ('scroll_past', -3, -3, 7, 'Scrolled past without action'),
  ('skip', -15, -10, 14, 'Explicitly skipped'),
  ('unfollow', -25, -20, 30, 'Unfollowed user');

-- Enable RLS (read-only for authenticated)
ALTER TABLE public.ml_signal_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signal weights"
  ON public.ml_signal_weights FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to calculate temporal decay
CREATE OR REPLACE FUNCTION calculate_decay_weight(
  created_at TIMESTAMPTZ,
  half_life_days INT
) RETURNS FLOAT AS $$
BEGIN
  RETURN EXP(-0.693 * EXTRACT(EPOCH FROM (now() - created_at)) / (half_life_days * 86400));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get interaction score between two users
CREATE OR REPLACE FUNCTION get_interaction_score(
  p_user_id UUID,
  p_target_user_id UUID,
  p_context TEXT DEFAULT 'pulse' -- 'pulse' or 'zone'
) RETURNS FLOAT AS $$
DECLARE
  total_score FLOAT := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE p_context 
      WHEN 'zone' THEN w.zone_weight 
      ELSE w.pulse_weight 
    END * calculate_decay_weight(e.created_at, w.decay_half_life_days)
  ), 0)
  INTO total_score
  FROM user_interaction_events e
  JOIN ml_signal_weights w ON w.signal_name = e.event_type
  WHERE e.user_id = p_user_id 
    AND e.target_user_id = p_target_user_id
    AND w.is_active = true;
    
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. TRIGGERS FOR AUTOMATIC TRACKING
-- =============================================

-- Trigger function to log follow events
CREATE OR REPLACE FUNCTION log_follow_interaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_interaction_events (user_id, target_user_id, event_type)
  VALUES (NEW.follower_id, NEW.following_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on followers table
DROP TRIGGER IF EXISTS trigger_log_follow ON followers;
CREATE TRIGGER trigger_log_follow
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION log_follow_interaction();

-- Trigger function to log unfollow events
CREATE OR REPLACE FUNCTION log_unfollow_interaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_interaction_events (user_id, target_user_id, event_type)
  VALUES (OLD.follower_id, OLD.following_id, 'unfollow');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for unfollows
DROP TRIGGER IF EXISTS trigger_log_unfollow ON followers;
CREATE TRIGGER trigger_log_unfollow
  AFTER DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION log_unfollow_interaction();

-- Trigger to update engagement scores updated_at
CREATE OR REPLACE FUNCTION update_engagement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_engagement_updated
  BEFORE UPDATE ON profile_engagement_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_timestamp();