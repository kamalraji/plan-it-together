
-- =====================================================
-- RLS Policy Consolidation Phase 3 + Duplicate Index Cleanup
-- Handle remaining duplicates across different role types
-- =====================================================

-- First, handle ALL policies that overlap with individual action policies
DO $fix_all_policies$
DECLARE
  tbl_rec RECORD;
  policy_rec RECORD;
BEGIN
  -- Find tables with ALL policy + individual policies for same role
  FOR tbl_rec IN
    SELECT DISTINCT p1.tablename, p1.roles::text as role_text
    FROM pg_policies p1
    WHERE p1.schemaname = 'public'
      AND p1.cmd = 'ALL'
      AND EXISTS (
        SELECT 1 FROM pg_policies p2
        WHERE p2.schemaname = 'public'
          AND p2.tablename = p1.tablename
          AND p2.roles::text = p1.roles::text
          AND p2.cmd != 'ALL'
      )
  LOOP
    -- Drop individual action policies (ALL already covers them)
    FOR policy_rec IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl_rec.tablename
        AND roles::text = tbl_rec.role_text
        AND cmd != 'ALL'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, tbl_rec.tablename);
      RAISE NOTICE 'Dropped % on % (covered by ALL policy)', policy_rec.policyname, tbl_rec.tablename;
    END LOOP;
  END LOOP;
END $fix_all_policies$;

-- Consolidate SELECT policies for each table/role combo
DO $consolidate_all$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_qual TEXT;
  combined_check TEXT;
  first_policy_name TEXT;
  policy_count INT;
  cmd_type TEXT;
BEGIN
  -- Process each command type
  FOREACH cmd_type IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
    FOR group_rec IN
      SELECT tablename, roles::text as role_text
      FROM pg_policies
      WHERE schemaname = 'public' AND cmd = cmd_type
      GROUP BY tablename, roles::text
      HAVING count(*) > 1
    LOOP
      combined_qual := '';
      combined_check := '';
      first_policy_name := NULL;
      policy_count := 0;

      FOR policy_rec IN
        SELECT policyname, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = group_rec.tablename
          AND roles::text = group_rec.role_text
          AND cmd = cmd_type
        ORDER BY policyname
      LOOP
        IF first_policy_name IS NULL THEN
          first_policy_name := policy_rec.policyname;
        END IF;

        IF policy_rec.qual IS NOT NULL AND policy_rec.qual != '' THEN
          IF combined_qual = '' THEN
            combined_qual := '(' || policy_rec.qual || ')';
          ELSE
            combined_qual := combined_qual || ' OR (' || policy_rec.qual || ')';
          END IF;
        END IF;

        IF policy_rec.with_check IS NOT NULL AND policy_rec.with_check != '' THEN
          IF combined_check = '' THEN
            combined_check := '(' || policy_rec.with_check || ')';
          ELSE
            combined_check := combined_check || ' OR (' || policy_rec.with_check || ')';
          END IF;
        END IF;

        policy_count := policy_count + 1;
      END LOOP;

      IF policy_count > 1 AND first_policy_name IS NOT NULL THEN
        -- Drop all policies in this group
        FOR policy_rec IN
          SELECT policyname
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = group_rec.tablename
            AND roles::text = group_rec.role_text
            AND cmd = cmd_type
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, group_rec.tablename);
        END LOOP;

        -- Default conditions if empty
        IF combined_qual = '' OR combined_qual IS NULL THEN
          combined_qual := 'true';
        END IF;

        -- Extract role name from {role_name} format
        DECLARE
          role_name TEXT := trim(both '{}' from group_rec.role_text);
        BEGIN
          IF cmd_type = 'SELECT' OR cmd_type = 'DELETE' THEN
            EXECUTE format(
              'CREATE POLICY %I ON public.%I FOR %s TO %I USING (%s)',
              first_policy_name, group_rec.tablename, cmd_type, role_name, combined_qual
            );
          ELSIF cmd_type = 'INSERT' THEN
            IF combined_check = '' OR combined_check IS NULL THEN
              combined_check := 'true';
            END IF;
            EXECUTE format(
              'CREATE POLICY %I ON public.%I FOR INSERT TO %I WITH CHECK (%s)',
              first_policy_name, group_rec.tablename, role_name, combined_check
            );
          ELSIF cmd_type = 'UPDATE' THEN
            IF combined_check != '' AND combined_check IS NOT NULL THEN
              EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR UPDATE TO %I USING (%s) WITH CHECK (%s)',
                first_policy_name, group_rec.tablename, role_name, combined_qual, combined_check
              );
            ELSE
              EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR UPDATE TO %I USING (%s)',
                first_policy_name, group_rec.tablename, role_name, combined_qual
              );
            END IF;
          END IF;
          RAISE NOTICE 'Consolidated % % policies on % into %', policy_count, cmd_type, group_rec.tablename, first_policy_name;
        END;
      END IF;
    END LOOP;
  END LOOP;
END $consolidate_all$;

-- =====================================================
-- Drop duplicate indexes
-- =====================================================
DROP INDEX IF EXISTS public.idx_live_streams_status;
DROP INDEX IF EXISTS public.idx_impact_profiles_online;
DROP INDEX IF EXISTS public.idx_login_attempts_ip_hash_created;
DROP INDEX IF EXISTS public.idx_organizer_applications_status;
DROP INDEX IF EXISTS public.idx_organizer_applications_user_id;

-- Keep these (drop the shorter-named ones):
-- idx_event_live_streams_stream_status (keep)
-- idx_impact_profiles_is_online (keep)  
-- idx_login_attempts_ip_created (keep)
-- idx_org_apps_status (keep)
-- idx_org_apps_user (keep)
