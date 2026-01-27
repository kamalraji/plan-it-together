-- Add missing admin policies for organizer_approvals table
CREATE POLICY "Admins can update organizer approvals"
ON public.organizer_approvals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete organizer approvals"
ON public.organizer_approvals
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin read access to onboarding_checklist for pending organizers workflow
CREATE POLICY "Admins can view all onboarding checklists"
ON public.onboarding_checklist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));