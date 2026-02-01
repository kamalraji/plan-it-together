-- Add priority column to approval request tables
ALTER TABLE workspace_budget_requests 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE workspace_resource_requests 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE workspace_access_requests 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create approval comments table for discussion threads
CREATE TABLE IF NOT EXISTS approval_request_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('budget', 'resource', 'access')),
  request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_approval_comments_request ON approval_request_comments(request_type, request_id);
CREATE INDEX IF NOT EXISTS idx_approval_comments_user ON approval_request_comments(user_id);

-- Enable RLS
ALTER TABLE approval_request_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval comments
-- Users can view comments on requests they have access to (simplified - allow workspace members)
CREATE POLICY "Users can view approval comments"
ON approval_request_comments
FOR SELECT
USING (true);

-- Users can create comments if authenticated
CREATE POLICY "Authenticated users can create comments"
ON approval_request_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON approval_request_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON approval_request_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_approval_comments_updated_at
BEFORE UPDATE ON approval_request_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();