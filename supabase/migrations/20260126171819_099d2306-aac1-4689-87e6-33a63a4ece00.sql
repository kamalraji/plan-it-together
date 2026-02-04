-- Fix RLS Performance Issues: Wrap auth.uid() and auth.jwt() in subselects
-- This optimizes 1030+ policies to evaluate auth functions once per query instead of per row

DO $$
DECLARE
  policy_rec RECORD;
  fixed_qual TEXT;
  fixed_with_check TEXT;
  create_stmt TEXT;
  roles_arr TEXT;
  permissive_text TEXT;
  processed_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting RLS performance optimization...';
  
  FOR policy_rec IN 
    SELECT 
      schemaname,
      tablename, 
      policyname, 
      permissive,
      cmd, 
      roles::text[] as roles,
      qual,
      with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual::text ~ 'auth\.(uid|jwt)\(\)' AND qual::text NOT LIKE '%( select auth.%' AND qual::text NOT LIKE '%(select auth.%')
        OR (with_check IS NOT NULL AND with_check::text ~ 'auth\.(uid|jwt)\(\)' AND with_check::text NOT LIKE '%( select auth.%' AND with_check::text NOT LIKE '%(select auth.%')
      )
  LOOP
    BEGIN
      -- Drop the old policy
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
        policy_rec.policyname, 
        policy_rec.schemaname, 
        policy_rec.tablename);
      
      -- Fix the USING clause by wrapping auth.uid() and auth.jwt() in subselects
      fixed_qual := policy_rec.qual;
      IF fixed_qual IS NOT NULL THEN
        fixed_qual := regexp_replace(fixed_qual, '(?<!\( select )(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
        fixed_qual := regexp_replace(fixed_qual, '(?<!\( select )(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      END IF;
      
      -- Fix the WITH CHECK clause
      fixed_with_check := policy_rec.with_check;
      IF fixed_with_check IS NOT NULL THEN
        fixed_with_check := regexp_replace(fixed_with_check, '(?<!\( select )(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
        fixed_with_check := regexp_replace(fixed_with_check, '(?<!\( select )(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      END IF;
      
      -- Build roles string
      IF policy_rec.roles IS NULL OR array_length(policy_rec.roles, 1) IS NULL OR policy_rec.roles = ARRAY['public']::text[] THEN
        roles_arr := 'public';
      ELSE
        roles_arr := array_to_string(policy_rec.roles, ', ');
      END IF;
      
      -- Determine permissive/restrictive
      IF policy_rec.permissive = 'PERMISSIVE' THEN
        permissive_text := 'AS PERMISSIVE';
      ELSE
        permissive_text := 'AS RESTRICTIVE';
      END IF;
      
      -- Build CREATE POLICY statement based on command type
      IF policy_rec.cmd = 'SELECT' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I %s FOR SELECT TO %s USING (%s)',
          policy_rec.policyname,
          policy_rec.schemaname,
          policy_rec.tablename,
          permissive_text,
          roles_arr,
          fixed_qual
        );
      ELSIF policy_rec.cmd = 'INSERT' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I %s FOR INSERT TO %s WITH CHECK (%s)',
          policy_rec.policyname,
          policy_rec.schemaname,
          policy_rec.tablename,
          permissive_text,
          roles_arr,
          COALESCE(fixed_with_check, 'true')
        );
      ELSIF policy_rec.cmd = 'UPDATE' THEN
        IF fixed_qual IS NOT NULL AND fixed_with_check IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_qual,
            fixed_with_check
          );
        ELSIF fixed_qual IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR UPDATE TO %s USING (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_qual
          );
        ELSE
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR UPDATE TO %s WITH CHECK (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_with_check
          );
        END IF;
      ELSIF policy_rec.cmd = 'DELETE' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I %s FOR DELETE TO %s USING (%s)',
          policy_rec.policyname,
          policy_rec.schemaname,
          policy_rec.tablename,
          permissive_text,
          roles_arr,
          fixed_qual
        );
      ELSIF policy_rec.cmd = 'ALL' THEN
        IF fixed_qual IS NOT NULL AND fixed_with_check IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR ALL TO %s USING (%s) WITH CHECK (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_qual,
            fixed_with_check
          );
        ELSIF fixed_qual IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR ALL TO %s USING (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_qual
          );
        ELSE
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I %s FOR ALL TO %s WITH CHECK (%s)',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            permissive_text,
            roles_arr,
            fixed_with_check
          );
        END IF;
      END IF;
      
      EXECUTE create_stmt;
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error processing policy % on table %: %', 
        policy_rec.policyname, policy_rec.tablename, SQLERRM;
      RAISE;
    END;
  END LOOP;
  
  RAISE NOTICE 'RLS optimization complete. Processed % policies.', processed_count;
END $$;