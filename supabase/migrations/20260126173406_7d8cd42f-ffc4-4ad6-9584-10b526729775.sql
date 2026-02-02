
-- =====================================================
-- RLS Policy Consolidation Phase 2
-- Fix duplicate policies caused by ALL + individual action overlap
-- =====================================================

-- Helper function to check if we should consolidate (avoids race conditions)
DO $consolidate$
DECLARE
  tbl_rec RECORD;
  policy_rec RECORD;
  has_all_policy BOOLEAN;
  all_policy_name TEXT;
  all_qual TEXT;
  all_with_check TEXT;
  all_roles TEXT[];
BEGIN
  -- Process each table that has an ALL policy plus other policies for the same role
  FOR tbl_rec IN
    SELECT DISTINCT p1.tablename, p1.roles::text[] as roles_arr
    FROM pg_policies p1
    WHERE p1.schemaname = 'public'
      AND p1.cmd = 'ALL'
      AND EXISTS (
        SELECT 1 FROM pg_policies p2
        WHERE p2.schemaname = 'public'
          AND p2.tablename = p1.tablename
          AND p2.roles = p1.roles
          AND p2.cmd != 'ALL'
      )
  LOOP
    -- Get the ALL policy details
    SELECT policyname, qual, with_check INTO all_policy_name, all_qual, all_with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = tbl_rec.tablename
      AND roles::text[] = tbl_rec.roles_arr
      AND cmd = 'ALL'
    LIMIT 1;

    -- Drop all individual action policies for this table/role combo (ALL covers them)
    FOR policy_rec IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl_rec.tablename
        AND roles::text[] = tbl_rec.roles_arr
        AND cmd != 'ALL'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, tbl_rec.tablename);
      RAISE NOTICE 'Dropped redundant policy % on % (covered by ALL)', policy_rec.policyname, tbl_rec.tablename;
    END LOOP;
  END LOOP;
END $consolidate$;

-- =====================================================
-- Consolidate multiple permissive SELECT policies (anon role)
-- =====================================================
DO $consolidate_select$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_qual TEXT := '';
  first_policy_name TEXT := NULL;
  policy_count INT := 0;
BEGIN
  FOR group_rec IN
    SELECT tablename, roles::text[] as roles_arr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'SELECT'
    GROUP BY tablename, roles::text[]
    HAVING count(*) > 1
  LOOP
    combined_qual := '';
    first_policy_name := NULL;
    policy_count := 0;

    FOR policy_rec IN
      SELECT policyname, qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = group_rec.tablename
        AND roles::text[] = group_rec.roles_arr
        AND cmd = 'SELECT'
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
      policy_count := policy_count + 1;
    END LOOP;

    IF policy_count > 1 AND first_policy_name IS NOT NULL THEN
      -- Drop all policies in this group
      FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = group_rec.tablename
          AND roles::text[] = group_rec.roles_arr
          AND cmd = 'SELECT'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, group_rec.tablename);
      END LOOP;

      -- Create consolidated policy
      IF combined_qual = '' OR combined_qual IS NULL THEN
        combined_qual := 'true';
      END IF;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO %s USING (%s)',
        first_policy_name,
        group_rec.tablename,
        array_to_string(group_rec.roles_arr, ', '),
        combined_qual
      );
      RAISE NOTICE 'Consolidated % SELECT policies on % into %', policy_count, group_rec.tablename, first_policy_name;
    END IF;
  END LOOP;
END $consolidate_select$;

-- =====================================================
-- Consolidate multiple permissive INSERT policies
-- =====================================================
DO $consolidate_insert$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_check TEXT := '';
  first_policy_name TEXT := NULL;
  policy_count INT := 0;
BEGIN
  FOR group_rec IN
    SELECT tablename, roles::text[] as roles_arr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'INSERT'
    GROUP BY tablename, roles::text[]
    HAVING count(*) > 1
  LOOP
    combined_check := '';
    first_policy_name := NULL;
    policy_count := 0;

    FOR policy_rec IN
      SELECT policyname, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = group_rec.tablename
        AND roles::text[] = group_rec.roles_arr
        AND cmd = 'INSERT'
      ORDER BY policyname
    LOOP
      IF first_policy_name IS NULL THEN
        first_policy_name := policy_rec.policyname;
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
      FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = group_rec.tablename
          AND roles::text[] = group_rec.roles_arr
          AND cmd = 'INSERT'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, group_rec.tablename);
      END LOOP;

      IF combined_check = '' OR combined_check IS NULL THEN
        combined_check := 'true';
      END IF;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO %s WITH CHECK (%s)',
        first_policy_name,
        group_rec.tablename,
        array_to_string(group_rec.roles_arr, ', '),
        combined_check
      );
      RAISE NOTICE 'Consolidated % INSERT policies on % into %', policy_count, group_rec.tablename, first_policy_name;
    END IF;
  END LOOP;
END $consolidate_insert$;

-- =====================================================
-- Consolidate multiple permissive UPDATE policies
-- =====================================================
DO $consolidate_update$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_qual TEXT := '';
  combined_check TEXT := '';
  first_policy_name TEXT := NULL;
  policy_count INT := 0;
BEGIN
  FOR group_rec IN
    SELECT tablename, roles::text[] as roles_arr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'UPDATE'
    GROUP BY tablename, roles::text[]
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
        AND roles::text[] = group_rec.roles_arr
        AND cmd = 'UPDATE'
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
      FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = group_rec.tablename
          AND roles::text[] = group_rec.roles_arr
          AND cmd = 'UPDATE'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, group_rec.tablename);
      END LOOP;

      IF combined_qual = '' OR combined_qual IS NULL THEN
        combined_qual := 'true';
      END IF;

      IF combined_check != '' AND combined_check IS NOT NULL THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
          first_policy_name,
          group_rec.tablename,
          array_to_string(group_rec.roles_arr, ', '),
          combined_qual,
          combined_check
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR UPDATE TO %s USING (%s)',
          first_policy_name,
          group_rec.tablename,
          array_to_string(group_rec.roles_arr, ', '),
          combined_qual
        );
      END IF;
      RAISE NOTICE 'Consolidated % UPDATE policies on % into %', policy_count, group_rec.tablename, first_policy_name;
    END IF;
  END LOOP;
END $consolidate_update$;

-- =====================================================
-- Consolidate multiple permissive DELETE policies
-- =====================================================
DO $consolidate_delete$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_qual TEXT := '';
  first_policy_name TEXT := NULL;
  policy_count INT := 0;
BEGIN
  FOR group_rec IN
    SELECT tablename, roles::text[] as roles_arr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'DELETE'
    GROUP BY tablename, roles::text[]
    HAVING count(*) > 1
  LOOP
    combined_qual := '';
    first_policy_name := NULL;
    policy_count := 0;

    FOR policy_rec IN
      SELECT policyname, qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = group_rec.tablename
        AND roles::text[] = group_rec.roles_arr
        AND cmd = 'DELETE'
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
      policy_count := policy_count + 1;
    END LOOP;

    IF policy_count > 1 AND first_policy_name IS NOT NULL THEN
      FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = group_rec.tablename
          AND roles::text[] = group_rec.roles_arr
          AND cmd = 'DELETE'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, group_rec.tablename);
      END LOOP;

      IF combined_qual = '' OR combined_qual IS NULL THEN
        combined_qual := 'true';
      END IF;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO %s USING (%s)',
        first_policy_name,
        group_rec.tablename,
        array_to_string(group_rec.roles_arr, ', '),
        combined_qual
      );
      RAISE NOTICE 'Consolidated % DELETE policies on % into %', policy_count, group_rec.tablename, first_policy_name;
    END IF;
  END LOOP;
END $consolidate_delete$;
