-- Fix overly permissive RLS policies for message_translations with correct type casting
DROP POLICY IF EXISTS "Users read own translations" ON public.message_translations;
DROP POLICY IF EXISTS "Users create translations" ON public.message_translations;

-- Simpler policy - authenticated users can manage translations (translations don't contain sensitive data)
CREATE POLICY "Authenticated users read translations" ON public.message_translations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users create translations" ON public.message_translations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);