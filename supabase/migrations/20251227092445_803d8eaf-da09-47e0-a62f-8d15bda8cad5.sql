-- Create judge_assignments table for per-judge submission assignment
CREATE TABLE public.judge_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT judge_assignments_unique_assignment UNIQUE (submission_id, judge_id)
);

-- Enable RLS on judge_assignments
ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;

-- Organizers and admins can manage all judge assignments
CREATE POLICY "Organizers manage judge assignments"
ON public.judge_assignments
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
);

-- Judges can view their own assignments only
CREATE POLICY "Judges view own assignments"
ON public.judge_assignments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (judge_id = auth.uid());