# Industrial Best Practice Knowledge for ThittamoneHub

## Overview

This knowledge document provides comprehensive guidelines for maintaining industrial-grade standards across your event management platform. The platform consists of:

- **Frontend**: React/TypeScript with Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, RLS)
- **Architecture**: Multi-role (participant, organizer, admin) with 35-role workspace hierarchy

---

## 1. Security Standards

### 1.1 Authentication & Authorization

```markdown
RULE: Never store roles in user profiles or auth.users table
- Use separate user_roles table with proper RLS
- Always use SECURITY DEFINER functions for role checks: has_role(), has_workspace_access()
- Set search_path = public on all security functions to prevent injection

RULE: Edge Function Authentication
- All Edge Functions must verify JWT or use service_role only for server-to-server
- Pattern:
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
```

### 1.2 Row Level Security (RLS)

```markdown
RULE: Every table with user data must have RLS enabled
- Use FORCE ROW LEVEL SECURITY for critical tables (user_profiles, payments)
- Prefer workspace access checks via has_workspace_access() function
- Never expose PII (email, phone) to anonymous users

PATTERN: Restrict sensitive data
CREATE POLICY "authenticated_only" ON user_profiles
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
```

### 1.3 Input Validation

```markdown
RULE: All Edge Functions must use Zod validation
- Import from supabase/functions/_shared/validation.ts
- Use strict() mode to reject unknown fields
- Apply body size limits (BODY_SIZE_LIMITS.small/medium/large)
- Use custom error map to prevent internal structure exposure

PATTERN:
const schema = z.object({
  workspaceId: uuidSchema,
  name: shortStringSchema,
}).strict();

const result = await parseAndValidate(req, schema, corsHeaders);
```

### 1.4 XSS Prevention

```markdown
RULE: Always sanitize user HTML content
- Use src/utils/sanitize.ts for HTML sanitization
- Never use dangerouslySetInnerHTML with raw user content
- Validate CSS values with sanitizeCSS() to prevent CSS injection
```

---

## 2. Query Optimization

### 2.1 Explicit Column Selection

```markdown
RULE: Never use select('*') in production code
- Import column constants from src/lib/supabase-columns.ts
- Use appropriate preset (list, detail, minimal) based on context

PATTERN:
import { WORKSPACE_TASK_COLUMNS } from '@/lib/supabase-columns';
const { data } = await supabase
  .from('workspace_tasks')
  .select(WORKSPACE_TASK_COLUMNS.list)
  .eq('workspace_id', workspaceId);
```

### 2.2 React Query Configuration

```markdown
RULE: Use query presets from src/lib/query-config.ts
- static: 30min stale for rarely changing data (organizations, settings)
- standard: 5min stale for events, workspaces
- dynamic: 1min stale for tasks, activities
- realtime: 10sec stale for notifications, live counts

PATTERN:
import { queryPresets, queryKeys } from '@/lib/query-config';

useQuery({
  queryKey: queryKeys.workspaces.detail(id),
  queryFn: fetchWorkspace,
  ...queryPresets.standard,
});
```

### 2.3 Pagination

```markdown
RULE: Use pagination for lists over 50 items
- Import getPaginationRange from src/lib/query-utils.ts
- Always include total count for UI pagination

PATTERN:
const { from, to } = getPaginationRange({ page, pageSize: 20 });
const { data, count } = await supabase
  .from('workspace_tasks')
  .select(WORKSPACE_TASK_COLUMNS.list, { count: 'exact' })
  .range(from, to);
```

---

## 3. Type Safety

### 3.1 Eliminate `as any`

```markdown
RULE: Never use 'as any' for type casting
- Use typed interfaces from src/types/supabase-helpers.ts
- Create specific interfaces for JSONB columns (branding, metadata)
- Use type guards: isObject(), hasProperty(), isNonEmptyArray()

PATTERN:
import { TaskWithAssignee, extractRelation } from '@/types/supabase-helpers';
const assignee = extractRelation(task.user_profiles);
```

### 3.2 JSONB Column Typing

```markdown
RULE: Always type JSONB columns
- Use parseEventBranding() from src/lib/query-utils.ts for event branding
- Define interfaces in src/types/event.types.ts

PATTERN:
interface EventBrandingExtended {
  primaryColor?: string;
  registration?: { type?: string; allowWaitlist?: boolean };
  ticketing?: { isFree?: boolean };
}
const branding = parseEventBranding(event.branding);
```

### 3.3 Safe Query Results

```markdown
RULE: Use query utilities for null-safe operations
- safeQuery(): throws if null returned
- safeQueryNullable(): allows null results
- safeMutation(): for insert/update/delete operations

PATTERN:
import { safeQuery, requireAuth } from '@/lib/query-utils';
const user = await requireAuth();
const task = await safeQuery(() => 
  supabase.from('workspace_tasks').select(COLS).eq('id', id).single(),
  'fetchTask'
);
```

---

## 4. Code Quality

### 4.1 Logging

```markdown
RULE: Use logger utility instead of console.*
- Import from src/lib/logger.ts
- Sentry integration automatic in production
- Use appropriate levels: debug, info, warn, error

PATTERN:
import { logger } from '@/lib/logger';

logger.debug('Fetching tasks', { workspaceId });
logger.error('Task creation failed', error, { taskTitle });
logger.api('POST', '/api/tasks', 201, 150);
```

### 4.2 Error Handling

```markdown
RULE: Use centralized error handling from src/lib/errors.ts
- Create AppError with appropriate ErrorCode
- Use fromSupabaseError() for database errors
- Use getUserMessage() for user-facing messages

PATTERN:
import { AppError, ErrorCode, handleError } from '@/lib/errors';

try {
  // operation
} catch (error) {
  throw handleError(error, 'createTask', { workspaceId });
}
```

### 4.3 Component Structure

```markdown
RULE: Decompose components over 500 lines
- Extract hooks to separate files (useXxxLoader, useXxxForm)
- Create sub-components for repeated patterns
- Use component folder structure:
  ComponentName/
    index.ts
    ComponentName.tsx
    hooks/
      useComponentData.ts
    components/
      SubComponent.tsx
```

---

## 5. Edge Function Standards

### 5.1 Structure

```markdown
RULE: Follow standard Edge Function template
- Import corsHeaders from _shared/cors.ts
- Handle OPTIONS preflight
- Use parseAndValidate for input validation
- Return consistent JSON response format

PATTERN:
import { corsHeaders } from "../_shared/cors.ts";
import { parseAndValidate, uuidSchema } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ... validation and logic

  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

### 5.2 Rate Limiting

```markdown
RULE: Apply rate limiting to public-facing endpoints
- Email sending: 10 requests/minute per user
- Page views: 60 requests/minute per IP
- File uploads: 5 requests/minute per user

PATTERN: Use IP-based rate limiting maps in memory
const rateLimitMap = new Map();
```

---

## 6. Database Standards

### 6.1 Indexes

```markdown
RULE: Create indexes for filtered/sorted columns
- Always index foreign keys
- Create composite indexes for common query patterns
- Use CONCURRENTLY for production index creation

PATTERN:
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_workspace_tasks_workspace_status 
  ON workspace_tasks(workspace_id, status);
```

### 6.2 Migrations

```markdown
RULE: Safe migration practices
- Always use IF EXISTS/IF NOT EXISTS
- Include rollback comments
- Test migrations on preview before production
- Never drop columns without data migration plan
```

---

## 7. Workspace Role Hierarchy

```markdown
Level 1: WORKSPACE_OWNER (full access)
Level 2: Department Managers (OPERATIONS_MANAGER, GROWTH_MANAGER, etc.)
Level 3: Team Leads (EVENT_LEAD, CATERING_LEAD, MARKETING_LEAD, etc.)
Level 4: Coordinators (EVENT_COORDINATOR, CATERING_COORDINATOR, etc.)

RULE: Use has_workspace_management_access() for management-level operations
RULE: Use workspaceRoleSchema from validation.ts for role validation
```

---

## Quick Reference

| Category | File/Location | Purpose |
|----------|---------------|---------|
| Column constants | `src/lib/supabase-columns.ts` | Query optimization |
| Query utilities | `src/lib/query-utils.ts` | Type-safe queries |
| Error handling | `src/lib/errors.ts` | Centralized errors |
| Logging | `src/lib/logger.ts` | Production-safe logs |
| Type helpers | `src/types/supabase-helpers.ts` | Joined query types |
| Validation | `supabase/functions/_shared/validation.ts` | Zod schemas |
| Query presets | `src/lib/query-config.ts` | Cache strategies |
