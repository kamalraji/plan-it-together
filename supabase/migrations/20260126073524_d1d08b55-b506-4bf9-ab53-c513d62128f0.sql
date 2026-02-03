-- Fix Legacy RLS Policies: Update all policies using deprecated role names
-- to use the correct 35-role WorkspaceRole hierarchy

-- ============================================
-- 1. CERTIFICATES TABLE
-- ============================================

DROP POLICY IF EXISTS "Workspace admins can delete certificates" ON certificates;

CREATE POLICY "Workspace admins can delete certificates"
ON certificates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = certificates.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'CONTENT_MANAGER',
      'TECH_FINANCE_MANAGER', 'CONTENT_LEAD'
    )
  )
);

-- ============================================
-- 2. CONTENT_APPROVALS TABLE
-- ============================================

DROP POLICY IF EXISTS "Workspace leads can update content approvals" ON content_approvals;

CREATE POLICY "Workspace leads can update content approvals"
ON content_approvals FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = content_approvals.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'GROWTH_MANAGER',
      'CONTENT_MANAGER', 'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER',
      'CONTENT_LEAD', 'MEDIA_LEAD', 'MARKETING_LEAD'
    )
  )
);

-- ============================================
-- 3. CONTENT_APPROVAL_STAGES TABLE (joins through content_approvals)
-- ============================================

DROP POLICY IF EXISTS "Workspace leads can manage approval stages" ON content_approval_stages;

CREATE POLICY "Workspace leads can manage approval stages"
ON content_approval_stages FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_approvals ca
    JOIN workspace_team_members wtm ON wtm.workspace_id = ca.workspace_id
    WHERE ca.id = content_approval_stages.approval_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'CONTENT_MANAGER',
      'GROWTH_MANAGER', 'CONTENT_LEAD', 'MEDIA_LEAD', 'MARKETING_LEAD'
    )
  )
);

-- ============================================
-- 4. EVENT_LIVE_STREAMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Workspace managers can create live streams" ON event_live_streams;

CREATE POLICY "Workspace managers can create live streams"
ON event_live_streams FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IS NULL OR EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'CONTENT_MANAGER', 'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD', 'CONTENT_LEAD'
    )
  )
);

DROP POLICY IF EXISTS "Workspace managers can update live streams" ON event_live_streams;

CREATE POLICY "Workspace managers can update live streams"
ON event_live_streams FOR UPDATE TO authenticated
USING (
  workspace_id IS NULL OR EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'CONTENT_MANAGER', 'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD', 'CONTENT_LEAD'
    )
  )
);

DROP POLICY IF EXISTS "Workspace managers can delete live streams" ON event_live_streams;

CREATE POLICY "Workspace managers can delete live streams"
ON event_live_streams FOR DELETE TO authenticated
USING (
  workspace_id IS NULL OR EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD'
    )
  )
);

-- ============================================
-- 5. SOCIAL_POST_QUEUE TABLE
-- ============================================

DROP POLICY IF EXISTS "Workspace leads can manage post queue" ON social_post_queue;

CREATE POLICY "Workspace leads can manage post queue"
ON social_post_queue FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = social_post_queue.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
      'SOCIAL_MEDIA_LEAD', 'MARKETING_LEAD', 'CONTENT_LEAD', 'MEDIA_LEAD',
      'SOCIAL_MEDIA_COORDINATOR', 'MARKETING_COORDINATOR'
    )
  )
);

-- ============================================
-- 6. STREAM_VIEWER_SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Workspace managers can view all sessions" ON stream_viewer_sessions;

CREATE POLICY "Workspace managers can view all sessions"
ON stream_viewer_sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_live_streams els
    JOIN workspace_team_members wtm ON wtm.workspace_id = els.workspace_id
    WHERE els.id = stream_viewer_sessions.stream_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD'
    )
  )
);

-- ============================================
-- 7. WORKSPACE_RESOURCE_REQUESTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Target workspace leads can update resource requests" ON workspace_resource_requests;

CREATE POLICY "Target workspace leads can update resource requests"
ON workspace_resource_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_resource_requests.target_workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'VOLUNTEERS_MANAGER',
      'EVENT_LEAD', 'LOGISTICS_LEAD', 'FACILITY_LEAD', 'VOLUNTEERS_LEAD',
      'EVENT_COORDINATOR', 'LOGISTICS_COORDINATOR', 'FACILITY_COORDINATOR'
    )
  )
);