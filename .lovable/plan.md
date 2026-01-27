

# Fix 1030+ RLS Performance Issues

## Problem Summary

Your Supabase database has **1030 performance warnings** caused by RLS policies that call `auth.uid()` and `auth.jwt()` functions directly. This causes the functions to be **re-evaluated for every single row** during queries, which severely impacts performance at scale.

**Scope of the issue:**
- **253 tables** affected
- **648+ RLS policies** need optimization
- All policies use patterns like `auth.uid() = user_id` or `has_role(auth.uid(), ...)`

---

## The Fix

Wrap all `auth.<function>()` calls in a subselect `(select auth.<function>())`. This tells PostgreSQL to evaluate the function **once per query** instead of once per row.

```text
BEFORE (slow - evaluated per row):
  auth.uid() = user_id
  has_role(auth.uid(), 'admin')

AFTER (fast - evaluated once):
  (select auth.uid()) = user_id
  has_role((select auth.uid()), 'admin')
```

---

## Solution Approach

Due to the large number of policies (1030+), I will create an **automated migration** that:

1. Queries all affected policies from the database
2. Generates `DROP POLICY` + `CREATE POLICY` statements with the fixed syntax
3. Applies changes in batches to avoid timeout issues

---

## Implementation Plan

### Phase 1: Create Automated Fix Migration

A single SQL migration that:

1. **Drops all affected policies** (policies using `auth.uid()` without the `select` wrapper)
2. **Recreates them** with optimized syntax: `(select auth.uid())` instead of `auth.uid()`

The migration will use a **DO block with dynamic SQL** to:
- Query `pg_policies` for all affected policies
- Extract the policy definition (table, name, command, roles, USING clause, WITH CHECK clause)
- Generate and execute the fixed policy statements

### Phase 2: Verification

After the migration:
- Re-run the Supabase linter to confirm 0 performance warnings
- Test critical queries to ensure RLS still works correctly

---

## Technical Details

### Migration Strategy

```text
DO $$
DECLARE
  policy_rec RECORD;
  fixed_qual TEXT;
  fixed_with_check TEXT;
BEGIN
  FOR policy_rec IN 
    SELECT tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%')
  LOOP
    -- Drop old policy
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_rec.policyname || '" ON public.' || policy_rec.tablename;
    
    -- Fix the expressions by wrapping auth.uid() in (select ...)
    fixed_qual := REPLACE(policy_rec.qual::text, 'auth.uid()', '(select auth.uid())');
    fixed_with_check := REPLACE(policy_rec.with_check::text, 'auth.uid()', '(select auth.uid())');
    
    -- Recreate policy with fixed expressions
    -- ... dynamic CREATE POLICY statement
  END LOOP;
END $$;
```

### Key Patterns to Fix

| Count | Pattern | Fix |
|-------|---------|-----|
| 225 | `column = auth.uid()` | `column = (select auth.uid())` |
| 162 | `auth.uid() = column` | `(select auth.uid()) = column` |
| 54 | `has_role(auth.uid(), ...)` | `has_role((select auth.uid()), ...)` |
| 47 | Other patterns | Apply same wrapping logic |

### Tables with Most Policies to Fix

| Table | Policies |
|-------|----------|
| stream_viewer_sessions | 10 |
| event_live_streams | 7 |
| registrations | 7 |
| notifications | 6 |
| profile_visibility_settings | 6 |
| user_roles | 6 |
| + 247 more tables... | |

---

## Risk Mitigation

1. **Transaction Safety**: All changes run in a single transaction - if any policy fails, everything rolls back
2. **No Data Loss**: Only RLS policies are modified, not table data
3. **Reversible**: Original policies can be restored from migration history
4. **Testing**: Verify RLS still works after migration by testing authenticated queries

---

## Expected Outcome

| Before | After |
|--------|-------|
| 1030 performance warnings | 0 warnings |
| ~253 affected tables | All optimized |
| Slow queries at scale | 10-100x faster RLS evaluation |

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_fix_rls_performance.sql` | Automated policy fix migration |

---

## Post-Migration Steps

1. Re-run Supabase linter to verify 0 performance issues
2. Test authentication flows to ensure RLS still works
3. Monitor query performance in production

