-- Create dedicated IT helpdesk tickets table
CREATE TABLE public.workspace_it_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Ticket identification
  ticket_number TEXT NOT NULL,
  
  -- Core ticket details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('software', 'hardware', 'access', 'network', 'security', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'pending_info', 'escalated', 'resolved', 'closed')),
  
  -- Requester information
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  requester_department TEXT,
  
  -- Assignment and escalation
  assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  escalated_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  escalated_to_name TEXT,
  escalation_level INTEGER DEFAULT 0,
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  
  -- SLA tracking
  sla_response_deadline TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  sla_response_breached BOOLEAN DEFAULT false,
  sla_resolution_breached BOOLEAN DEFAULT false,
  
  -- Resolution details
  resolution_notes TEXT,
  resolution_category TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  
  -- Related items
  related_asset_id UUID,
  related_asset_name TEXT,
  related_license_id UUID REFERENCES public.workspace_software_licenses(id) ON DELETE SET NULL,
  
  -- Impact assessment
  impact_level TEXT DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_users_count INTEGER DEFAULT 1,
  
  -- Communication
  internal_notes TEXT,
  
  -- Satisfaction tracking
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  
  -- Audit fields
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_workspace_it_tickets_workspace ON public.workspace_it_tickets(workspace_id);
CREATE INDEX idx_workspace_it_tickets_status ON public.workspace_it_tickets(status);
CREATE INDEX idx_workspace_it_tickets_priority ON public.workspace_it_tickets(priority);
CREATE INDEX idx_workspace_it_tickets_assigned ON public.workspace_it_tickets(assigned_to_id);
CREATE INDEX idx_workspace_it_tickets_sla_response ON public.workspace_it_tickets(sla_response_deadline) WHERE sla_response_breached = false;
CREATE INDEX idx_workspace_it_tickets_sla_resolution ON public.workspace_it_tickets(sla_resolution_deadline) WHERE sla_resolution_breached = false;
CREATE UNIQUE INDEX idx_workspace_it_tickets_number ON public.workspace_it_tickets(workspace_id, ticket_number);

-- Enable RLS
ALTER TABLE public.workspace_it_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view IT tickets in their workspace"
ON public.workspace_it_tickets FOR SELECT
USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can create IT tickets in their workspace"
ON public.workspace_it_tickets FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Users can update IT tickets in their workspace"
ON public.workspace_it_tickets FOR UPDATE
USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Managers can delete IT tickets"
ON public.workspace_it_tickets FOR DELETE
USING (public.has_workspace_management_access(workspace_id, auth.uid()));

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_it_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO ticket_count
  FROM public.workspace_it_tickets
  WHERE workspace_id = NEW.workspace_id;
  
  NEW.ticket_number := 'IT-' || LPAD(ticket_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger for auto ticket number
CREATE TRIGGER trigger_generate_it_ticket_number
BEFORE INSERT ON public.workspace_it_tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_it_ticket_number();

-- Function to set SLA deadlines based on priority
CREATE OR REPLACE FUNCTION public.set_it_ticket_sla_deadlines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set SLA response and resolution deadlines based on priority
  CASE NEW.priority
    WHEN 'critical' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '15 minutes';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '2 hours';
    WHEN 'urgent' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '30 minutes';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '4 hours';
    WHEN 'high' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '1 hour';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '8 hours';
    WHEN 'medium' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '4 hours';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '24 hours';
    WHEN 'low' THEN
      NEW.sla_response_deadline := NEW.created_at + INTERVAL '8 hours';
      NEW.sla_resolution_deadline := NEW.created_at + INTERVAL '48 hours';
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Trigger for SLA deadlines
CREATE TRIGGER trigger_set_it_ticket_sla
BEFORE INSERT ON public.workspace_it_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_it_ticket_sla_deadlines();

-- Updated_at trigger
CREATE TRIGGER trigger_workspace_it_tickets_updated_at
BEFORE UPDATE ON public.workspace_it_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and mark SLA breaches
CREATE OR REPLACE FUNCTION public.check_it_ticket_sla_breach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check response SLA breach
  IF NEW.first_response_at IS NULL AND NEW.sla_response_deadline < NOW() THEN
    NEW.sla_response_breached := true;
  END IF;
  
  -- Check resolution SLA breach
  IF NEW.resolved_at IS NULL AND NEW.sla_resolution_deadline < NOW() THEN
    NEW.sla_resolution_breached := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for SLA breach checking on update
CREATE TRIGGER trigger_check_it_ticket_sla_breach
BEFORE UPDATE ON public.workspace_it_tickets
FOR EACH ROW
EXECUTE FUNCTION public.check_it_ticket_sla_breach();