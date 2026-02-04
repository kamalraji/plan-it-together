# RLS Policy Consolidation Plan

## Problem Summary

**382 "Multiple Permissive Policies" warnings** detected in the Supabase database.

When multiple permissive policies exist for the same table/role/action, PostgreSQL must evaluate **all of them** for every row (policies are OR'd together). This creates performance overhead.

---

## What This Means

For example, if `public.events` has these policies for `anon` + `SELECT`:
1. "Anon view published public events"
2. "Participants can view public events"

PostgreSQL evaluates BOTH policies for every row, even though only one needs to match.

---

## The Fix Pattern

Consolidate multiple permissive policies into a **single policy** using OR logic:

```sql
-- BEFORE (2 policies, both evaluated for every row)
CREATE POLICY "Policy A" ON public.events FOR SELECT TO anon USING (condition_a);
CREATE POLICY "Policy B" ON public.events FOR SELECT TO anon USING (condition_b);

-- AFTER (1 policy, single evaluation)
CREATE POLICY "Consolidated policy" ON public.events FOR SELECT TO anon 
USING (condition_a OR condition_b);
```

---

## Affected Tables Summary

| Table | Role | Action | Policies to Consolidate |
|-------|------|--------|------------------------|
| certificate_delegation | anon | SELECT | 2 policies |
| certificate_templates | anon | SELECT | 2 policies |
| certificates | anon | SELECT | 2 policies |
| channel_messages | anon | SELECT | 2 policies |
| circle_invite_links | anon | SELECT | 2 policies |
| circles | anon | SELECT | 2 policies |
| competition_badges | anon | SELECT | 3 policies |
| competition_presence | anon | SELECT | 2 policies |
| competition_questions | anon | SELECT | 2 policies |
| competition_rounds | anon | SELECT | 2 policies |
| competition_scores | anon | SELECT | 2 policies |
| consent_categories | anon | SELECT | 2 policies |
| event_announcements | anon | SELECT | 2 policies |
| event_faqs | anon | SELECT | 2 policies |
| event_images | anon | SELECT | 2 policies |
| event_sessions | anon | SELECT | 2 policies |
| event_venues | anon | SELECT | 2 policies |
| event_waitlist | anon | SELECT/INSERT/UPDATE/DELETE | 2 policies each |
| events | anon | SELECT | 2 policies |
| followers | anon | DELETE | 2 policies |
| hackathon_submissions | anon | SELECT | 2 policies |
| notifications | anon | SELECT/UPDATE/DELETE | multiple policies |
| organization_products | anon | SELECT | 2 policies |
| organization_sponsors | anon | SELECT | 2 policies |
| organization_testimonials | anon | SELECT | 2 policies |
| page_builder_sections | anon | SELECT | 2 policies |
| payments | anon | SELECT | 2 policies |
| ... and ~100+ more tables | | | |

---

## Priority Tables (High Traffic)

These tables should be consolidated first:

1. **events** - Core table, high read frequency
2. **registrations** - Frequently queried
3. **notifications** - Real-time queries
4. **user_profiles** - Profile lookups
5. **workspaces** - Workspace queries
6. **workspace_members** - Membership checks
7. **channel_messages** - Chat messages
8. **event_sessions** - Session listings

---

## How to Consolidate

For each table with multiple policies:

1. Query existing policies:
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'YOUR_TABLE'
ORDER BY cmd, roles;
```

2. Group policies by `(cmd, roles)` pairs

3. Combine USING clauses with OR:
```sql
DROP POLICY "Policy A" ON public.your_table;
DROP POLICY "Policy B" ON public.your_table;

CREATE POLICY "Consolidated select policy" ON public.your_table
FOR SELECT TO anon
USING (
  (/* condition from Policy A */)
  OR
  (/* condition from Policy B */)
);
```

4. Test to ensure access patterns still work

---

## Automation Script

To generate consolidation SQL for a specific table:

```sql
SELECT 
  tablename,
  cmd,
  array_to_string(roles, ', ') as roles,
  array_agg(policyname) as policies_to_merge,
  '(' || array_to_string(array_agg('(' || qual || ')'), ' OR ') || ')' as combined_qual
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING count(*) > 1
ORDER BY tablename, cmd;
```

---

## Timeline

- **Phase 1**: Consolidate priority tables (8 tables) - ~2 hours
- **Phase 2**: Consolidate medium-priority tables (~30 tables) - ~4 hours  
- **Phase 3**: Consolidate remaining tables (~60+ tables) - ~6 hours

---

## Status: ✅ COMPLETED

**All 1,412 performance warnings have been resolved:**

- ✅ **1,030 `auth_rls_initplan`** warnings - Fixed by wrapping `auth.uid()` in `(select auth.uid())`
- ✅ **382 `multiple_permissive_policies`** warnings - Fixed via automated consolidation migration

**Remaining (non-blocking):**
- Extension in Public (security recommendation)
- Leaked Password Protection Disabled (enable in Supabase dashboard)

---

## Migration Applied

The consolidation migration:
1. Removed redundant policies where an `ALL` policy already covered `SELECT/INSERT/UPDATE/DELETE`
2. Merged duplicate policies for the same table/role/action into single policies using `OR` logic
3. Preserved all original access control logic

**Date completed:** 2026-01-26
