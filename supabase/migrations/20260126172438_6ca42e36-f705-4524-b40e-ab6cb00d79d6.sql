-- Fix remaining auth_rls_initplan warning on payments table
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

CREATE POLICY "Service role can manage payments" ON public.payments
AS PERMISSIVE FOR ALL TO public
USING ((select auth.role()) = 'service_role'::text);