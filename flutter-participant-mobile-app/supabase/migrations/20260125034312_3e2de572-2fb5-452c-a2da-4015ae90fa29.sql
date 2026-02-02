-- =============================================================================
-- ORGANIZER APPLICATION SYSTEM - Database Schema
-- =============================================================================

-- 1. Create organizer_applications table
CREATE TABLE public.organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Organization Details
  organization_name TEXT NOT NULL DEFAULT '',
  organization_type TEXT NOT NULL DEFAULT 'individual' CHECK (organization_type IN ('individual', 'company', 'ngo', 'educational', 'government')),
  organization_website TEXT,
  organization_size TEXT CHECK (organization_size IS NULL OR organization_size IN ('solo', '2-10', '11-50', '51-200', '200+')),
  organization_description TEXT,
  
  -- Step 2: Experience
  past_events_count TEXT CHECK (past_events_count IS NULL OR past_events_count IN ('none', '1-5', '6-20', '20+')),
  event_types TEXT[] DEFAULT '{}',
  largest_event_size TEXT CHECK (largest_event_size IS NULL OR largest_event_size IN ('<50', '50-200', '200-1000', '1000+')),
  experience_description TEXT,
  portfolio_links TEXT[] DEFAULT '{}',
  
  -- Step 3: Documents
  verification_document_url TEXT,
  verification_document_type TEXT CHECK (verification_document_type IS NULL OR verification_document_type IN ('business_license', 'registration_cert', 'tax_id', 'identity')),
  additional_documents JSONB DEFAULT '[]',
  
  -- Status Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_more_info')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  admin_request_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. Create application_status_history audit table
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.organizer_applications(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX idx_org_apps_user ON public.organizer_applications(user_id);
CREATE INDEX idx_org_apps_status ON public.organizer_applications(status);
CREATE INDEX idx_org_apps_submitted ON public.organizer_applications(submitted_at DESC);
CREATE INDEX idx_app_history_application ON public.application_status_history(application_id);
CREATE INDEX idx_app_history_created ON public.application_status_history(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for organizer_applications

-- Users can view their own application
CREATE POLICY "organizer_apps_select_own" ON public.organizer_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can create their own application
CREATE POLICY "organizer_apps_insert_own" ON public.organizer_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update only while in draft or requires_more_info status
CREATE POLICY "organizer_apps_update_own" ON public.organizer_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('draft', 'requires_more_info'))
  WITH CHECK (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "organizer_apps_admin_all" ON public.organizer_applications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS Policies for application_status_history

-- Users can view their own application history
CREATE POLICY "app_history_select_own" ON public.application_status_history
  FOR SELECT TO authenticated
  USING (application_id IN (SELECT id FROM public.organizer_applications WHERE user_id = auth.uid()));

-- Admins can view all history
CREATE POLICY "app_history_admin_select" ON public.application_status_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow trigger to insert history (SECURITY DEFINER function handles this)
-- No explicit INSERT policy needed since trigger uses SECURITY DEFINER

-- 7. Create trigger function for status history logging
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.application_status_history (
      application_id, 
      previous_status, 
      new_status, 
      changed_by, 
      reason,
      metadata
    ) VALUES (
      NEW.id, 
      OLD.status, 
      NEW.status, 
      auth.uid(),
      CASE 
        WHEN NEW.status = 'rejected' THEN NEW.rejection_reason 
        WHEN NEW.status = 'requires_more_info' THEN NEW.admin_request_message
        ELSE NULL 
      END,
      jsonb_build_object('submitted_at', NEW.submitted_at, 'reviewed_at', NEW.reviewed_at)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Create trigger for status history
CREATE TRIGGER trigger_log_application_status
  AFTER UPDATE ON public.organizer_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status_change();

-- 9. Create trigger for updated_at
CREATE TRIGGER update_organizer_applications_updated_at
  BEFORE UPDATE ON public.organizer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create storage bucket for organizer documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('organizer-documents', 'organizer-documents', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- 11. Storage policies for organizer-documents bucket

-- Users can upload their own documents (scoped to user folder)
CREATE POLICY "org_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'organizer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own documents
CREATE POLICY "org_docs_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'organizer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own documents
CREATE POLICY "org_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'organizer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all documents for review
CREATE POLICY "org_docs_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'organizer-documents' AND public.has_role(auth.uid(), 'admin'));