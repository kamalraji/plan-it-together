-- Task comments with @mentions support
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  mentions UUID[] DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Comment reactions (emoji)
CREATE TABLE task_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Task activity log (auto-tracked changes)
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track template usage for analytics
CREATE TABLE industry_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  tasks_imported INTEGER NOT NULL,
  import_options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_id);
CREATE INDEX idx_task_reactions_comment ON task_comment_reactions(comment_id);
CREATE INDEX idx_task_activities_task ON task_activities(task_id);
CREATE INDEX idx_task_activities_type ON task_activities(activity_type);
CREATE INDEX idx_template_usage_workspace ON industry_template_usage(workspace_id);
CREATE INDEX idx_template_usage_template ON industry_template_usage(template_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comment_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activities;

-- RLS Policies
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_template_usage ENABLE ROW LEVEL SECURITY;

-- RLS for comments
CREATE POLICY "Workspace members can view task comments"
ON task_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_tasks wt
    JOIN workspace_team_members wtm ON wtm.workspace_id = wt.workspace_id
    WHERE wt.id = task_comments.task_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on workspace tasks"
ON task_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON task_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON task_comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS for reactions
CREATE POLICY "Workspace members can view reactions"
ON task_comment_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM task_comments tc
    JOIN workspace_tasks wt ON wt.id = tc.task_id
    JOIN workspace_team_members wtm ON wtm.workspace_id = wt.workspace_id
    WHERE tc.id = task_comment_reactions.comment_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions"
ON task_comment_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON task_comment_reactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS for activities
CREATE POLICY "Workspace members can view activities"
ON task_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_tasks wt
    JOIN workspace_team_members wtm ON wtm.workspace_id = wt.workspace_id
    WHERE wt.id = task_activities.task_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activities"
ON task_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS for template usage
CREATE POLICY "Users can view own template usage"
ON industry_template_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can track template usage"
ON industry_template_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);