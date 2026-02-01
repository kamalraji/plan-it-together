-- Create support ticket priority enum
CREATE TYPE public.support_ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create support ticket status enum  
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'pending', 'on_hold', 'resolved', 'closed');

-- Create support ticket category enum
CREATE TYPE public.support_ticket_category AS ENUM ('bug', 'request', 'question', 'incident', 'feature', 'hardware', 'network', 'other');

-- Create workspace support tickets table
CREATE TABLE public.workspace_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Ticket identification
  ticket_number TEXT NOT NULL,
  
  -- Core ticket info
  title TEXT NOT NULL,
  description TEXT,
  category support_ticket_category NOT NULL DEFAULT 'other',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  status support_ticket_status NOT NULL DEFAULT 'open',
  
  -- Location/context
  location TEXT,
  affected_system TEXT,
  
  -- Reporter info
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  
  -- Assignment
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- SLA tracking
  sla_response_deadline TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Escalation
  is_escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  escalation_reason TEXT,
  
  -- Linked incident (if escalated to formal incident)
  linked_incident_id UUID REFERENCES public.workspace_incidents(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[],
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_support_tickets_workspace ON public.workspace_support_tickets(workspace_id);
CREATE INDEX idx_support_tickets_status ON public.workspace_support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.workspace_support_tickets(priority);
CREATE INDEX idx_support_tickets_assignee ON public.workspace_support_tickets(assignee_id);
CREATE INDEX idx_support_tickets_created ON public.workspace_support_tickets(created_at DESC);

-- Enable RLS
ALTER TABLE public.workspace_support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tickets in their workspace"
ON public.workspace_support_tickets FOR SELECT
USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can create tickets in their workspace"
ON public.workspace_support_tickets FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update tickets"
ON public.workspace_support_tickets FOR UPDATE
USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace managers can delete tickets"
ON public.workspace_support_tickets FOR DELETE
USING (public.has_workspace_management_access(workspace_id, auth.uid()));

-- Create ticket activity log table for audit trail
CREATE TABLE public.workspace_ticket_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.workspace_support_tickets(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'priority_changed', 'commented', 'escalated', 'resolved'
  previous_value TEXT,
  new_value TEXT,
  comment TEXT,
  
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_activities_ticket ON public.workspace_ticket_activities(ticket_id);

-- Enable RLS on activities
ALTER TABLE public.workspace_ticket_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket activities"
ON public.workspace_ticket_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_support_tickets t
    WHERE t.id = ticket_id AND public.has_workspace_access(t.workspace_id, auth.uid())
  )
);

CREATE POLICY "Users can add ticket activities"
ON public.workspace_ticket_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_support_tickets t
    WHERE t.id = ticket_id AND public.has_workspace_access(t.workspace_id, auth.uid())
  )
);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  ticket_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO ticket_count
  FROM public.workspace_support_tickets
  WHERE workspace_id = NEW.workspace_id;
  
  NEW.ticket_number := 'TKT-' || LPAD(ticket_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate ticket number
CREATE TRIGGER generate_ticket_number_trigger
BEFORE INSERT ON public.workspace_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();

-- Function to set SLA deadlines based on priority
CREATE OR REPLACE FUNCTION public.set_ticket_sla_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Set SLA response deadlines based on priority
  CASE NEW.priority
    WHEN 'critical' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '15 minutes';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '2 hours';
    WHEN 'high' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '30 minutes';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '4 hours';
    WHEN 'medium' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '2 hours';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '8 hours';
    WHEN 'low' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '4 hours';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '24 hours';
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for SLA deadlines
CREATE TRIGGER set_ticket_sla_trigger
BEFORE INSERT ON public.workspace_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_sla_deadlines();

-- Updated at trigger
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.workspace_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_ticket_activities;