-- Consolidate Multiple Permissive Policies into Single Optimized Policies
-- Industrial Best Practice: One policy per (table, role, action) combination

DO $$
DECLARE
  group_rec RECORD;
  policy_rec RECORD;
  combined_qual TEXT;
  combined_with_check TEXT;
  first_policy_name TEXT;
  create_stmt TEXT;
  roles_str TEXT;
  processed_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting RLS policy consolidation...';
  
  -- Loop through each group of duplicate policies (same table, cmd, roles)
  FOR group_rec IN 
    SELECT 
      schemaname,
      tablename, 
      cmd,
      roles::text[] as roles,
      permissive,
      count(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
    GROUP BY schemaname, tablename, cmd, roles, permissive
    HAVING count(*) > 1
    ORDER BY tablename, cmd
  LOOP
    BEGIN
      combined_qual := NULL;
      combined_with_check := NULL;
      first_policy_name := NULL;
      
      -- Collect all policies in this group and combine their conditions
      FOR policy_rec IN 
        SELECT policyname, qual, with_check
        FROM pg_policies 
        WHERE schemaname = group_rec.schemaname
          AND tablename = group_rec.tablename
          AND cmd = group_rec.cmd
          AND roles::text[] = group_rec.roles
          AND permissive = 'PERMISSIVE'
        ORDER BY policyname
      LOOP
        -- Store first policy name for the consolidated policy
        IF first_policy_name IS NULL THEN
          first_policy_name := policy_rec.policyname;
        END IF;
        
        -- Combine USING clauses with OR
        IF policy_rec.qual IS NOT NULL THEN
          IF combined_qual IS NULL THEN
            combined_qual := '(' || policy_rec.qual || ')';
          ELSE
            combined_qual := combined_qual || ' OR (' || policy_rec.qual || ')';
          END IF;
        END IF;
        
        -- Combine WITH CHECK clauses with OR
        IF policy_rec.with_check IS NOT NULL THEN
          IF combined_with_check IS NULL THEN
            combined_with_check := '(' || policy_rec.with_check || ')';
          ELSE
            combined_with_check := combined_with_check || ' OR (' || policy_rec.with_check || ')';
          END IF;
        END IF;
        
        -- Drop this policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
          policy_rec.policyname, 
          group_rec.schemaname, 
          group_rec.tablename);
      END LOOP;
      
      -- Build roles string
      IF group_rec.roles IS NULL OR array_length(group_rec.roles, 1) IS NULL OR group_rec.roles = ARRAY['public']::text[] THEN
        roles_str := 'public';
      ELSE
        roles_str := array_to_string(group_rec.roles, ', ');
      END IF;
      
      -- Create consolidated policy
      IF group_rec.cmd = 'SELECT' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR SELECT TO %s USING (%s)',
          first_policy_name,
          group_rec.schemaname,
          group_rec.tablename,
          roles_str,
          COALESCE(combined_qual, 'true')
        );
      ELSIF group_rec.cmd = 'INSERT' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR INSERT TO %s WITH CHECK (%s)',
          first_policy_name,
          group_rec.schemaname,
          group_rec.tablename,
          roles_str,
          COALESCE(combined_with_check, combined_qual, 'true')
        );
      ELSIF group_rec.cmd = 'UPDATE' THEN
        IF combined_qual IS NOT NULL AND combined_with_check IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_qual,
            combined_with_check
          );
        ELSIF combined_qual IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR UPDATE TO %s USING (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_qual
          );
        ELSE
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR UPDATE TO %s WITH CHECK (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_with_check
          );
        END IF;
      ELSIF group_rec.cmd = 'DELETE' THEN
        create_stmt := format(
          'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR DELETE TO %s USING (%s)',
          first_policy_name,
          group_rec.schemaname,
          group_rec.tablename,
          roles_str,
          COALESCE(combined_qual, 'true')
        );
      ELSIF group_rec.cmd = 'ALL' THEN
        IF combined_qual IS NOT NULL AND combined_with_check IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR ALL TO %s USING (%s) WITH CHECK (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_qual,
            combined_with_check
          );
        ELSIF combined_qual IS NOT NULL THEN
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR ALL TO %s USING (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_qual
          );
        ELSE
          create_stmt := format(
            'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR ALL TO %s WITH CHECK (%s)',
            first_policy_name,
            group_rec.schemaname,
            group_rec.tablename,
            roles_str,
            combined_with_check
          );
        END IF;
      END IF;
      
      EXECUTE create_stmt;
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error consolidating policies for %.%: %', 
        group_rec.schemaname, group_rec.tablename, SQLERRM;
      RAISE;
    END;
  END LOOP;
  
  RAISE NOTICE 'Policy consolidation complete. Processed % policy groups.', processed_count;
END $$;