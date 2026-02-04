-- Create slugify function for channel naming (if not exists)
CREATE OR REPLACE FUNCTION public.slugify(text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(text, '[^\w\s-]', '', 'g'),
        '[\s_-]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function for auto-creating session channels
CREATE OR REPLACE FUNCTION public.auto_create_session_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_category_id UUID;
  v_channel_name TEXT;
  v_channel_id UUID;
BEGIN
  -- Only trigger when session is published
  IF NEW.status = 'PUBLISHED' AND (OLD.status IS NULL OR OLD.status <> 'PUBLISHED') THEN
    -- Get the ROOT workspace for this event
    SELECT id INTO v_workspace_id
    FROM workspaces
    WHERE event_id = NEW.event_id 
      AND workspace_type = 'ROOT'
    LIMIT 1;
    
    IF v_workspace_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get or create SESSIONS category
    SELECT id INTO v_category_id
    FROM workspace_channel_categories
    WHERE workspace_id = v_workspace_id AND name = 'SESSIONS'
    LIMIT 1;
    
    IF v_category_id IS NULL THEN
      INSERT INTO workspace_channel_categories (workspace_id, name, sort_order)
      VALUES (v_workspace_id, 'SESSIONS', 20)
      RETURNING id INTO v_category_id;
    END IF;
    
    -- Generate channel name
    v_channel_name := 'session-' || SUBSTRING(slugify(NEW.title) FROM 1 FOR 50);
    
    -- Check if channel already exists
    SELECT id INTO v_channel_id
    FROM workspace_channels
    WHERE workspace_id = v_workspace_id AND name = v_channel_name
    LIMIT 1;
    
    -- Create channel if it doesn't exist
    IF v_channel_id IS NULL THEN
      INSERT INTO workspace_channels (
        workspace_id, name, description, type, 
        is_participant_channel, auto_join_on_registration,
        participant_permissions, category_id
      )
      VALUES (
        v_workspace_id,
        v_channel_name,
        'Discussion for session: ' || NEW.title,
        'general',
        true,
        false,
        '{"can_read": true, "can_write": true}'::jsonb,
        v_category_id
      )
      RETURNING id INTO v_channel_id;
    END IF;
    
    -- Link channel to session
    INSERT INTO session_channels (session_id, channel_id, auto_created)
    VALUES (NEW.id, v_channel_id, true)
    ON CONFLICT (session_id, channel_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on event_sessions
DROP TRIGGER IF EXISTS trigger_auto_create_session_channel ON event_sessions;
CREATE TRIGGER trigger_auto_create_session_channel
  AFTER INSERT OR UPDATE OF status ON event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_session_channel();

-- Create trigger function for cleanup when session is deleted
CREATE OR REPLACE FUNCTION public.cleanup_session_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_channel_id UUID;
  v_auto_created BOOLEAN;
BEGIN
  SELECT channel_id, auto_created INTO v_channel_id, v_auto_created
  FROM session_channels
  WHERE session_id = OLD.id;
  
  IF v_channel_id IS NOT NULL THEN
    DELETE FROM session_channels WHERE session_id = OLD.id;
    
    IF v_auto_created THEN
      DELETE FROM workspace_channels WHERE id = v_channel_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create cleanup trigger
DROP TRIGGER IF EXISTS trigger_cleanup_session_channel ON event_sessions;
CREATE TRIGGER trigger_cleanup_session_channel
  BEFORE DELETE ON event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_session_channel();

-- Enable RLS on session_channels if not already
ALTER TABLE session_channels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Session channels are viewable by workspace members" ON session_channels;
DROP POLICY IF EXISTS "Authorized users can manage session channels" ON session_channels;

CREATE POLICY "Session channels are viewable by workspace members"
ON session_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_channels wc
    JOIN workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
    WHERE wc.id = session_channels.channel_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Authorized users can manage session channels"
ON session_channels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_channels wc
    JOIN workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
    WHERE wc.id = session_channels.channel_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'ADMIN')
  )
);