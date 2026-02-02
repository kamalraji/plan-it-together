---
llm_metadata:
  project: thittam1hub
  apps: [react-web, flutter-mobile]
  backend: supabase
  version: 1.0.0
  last_updated: 2026-02-02
  supabase_project_id: ltsniuflqfahdcirrmjh
---

# LLM Development Guide for Thittam1Hub

## Quick Start for AI Assistants

This guide provides structured context for AI-assisted development across both the React organizer web app and Flutter participant mobile app.

### Project Context

| Aspect | Web App | Mobile App |
|--------|---------|------------|
| **Purpose** | Organizer dashboard for event management | Participant app for attendees |
| **Framework** | React 18 + TypeScript | Flutter 3.4+ / Dart |
| **Location** | `apps/web/` | `apps/mobile/` |
| **State Management** | TanStack Query + Zustand | Provider + ChangeNotifier |
| **Routing** | React Router v7 | GoRouter |
| **UI Framework** | Tailwind CSS + shadcn/ui | Material Design + Custom Widgets |

### Key Entry Points

| App | Entry Point | Router | State Store |
|-----|-------------|--------|-------------|
| Web | `apps/web/src/main.tsx` | `src/components/routing/AppRouter.tsx` | TanStack Query |
| Mobile | `apps/mobile/lib/main.dart` | `lib/nav.dart` | Provider |

### Shared Backend (Supabase)

| Resource | Location | Purpose |
|----------|----------|---------|
| Edge Functions | `supabase/functions/` | API endpoints for both apps |
| Migrations | `supabase/migrations/` | Database schema changes |
| Config | `supabase/config.toml` | Function configuration |
| TypeScript Types | `apps/web/src/integrations/supabase/types.ts` | Auto-generated types |
| Dart Models | `apps/mobile/lib/models/` | Hand-written data classes |

---

## Architecture Overview

### Monorepo Structure

```
/
├── apps/
│   ├── web/                    # React Organizer Web App
│   │   ├── src/
│   │   │   ├── components/     # UI Components (shadcn-based)
│   │   │   ├── hooks/          # React Hooks (data fetching, state)
│   │   │   ├── pages/          # Route pages
│   │   │   ├── lib/            # Utilities
│   │   │   └── integrations/   # Supabase client
│   │   ├── public/             # Static assets
│   │   └── package.json
│   │
│   └── mobile/                 # Flutter Participant Mobile App
│       ├── lib/
│       │   ├── models/         # Data classes
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Data access layer
│       │   ├── providers/      # State management
│       │   ├── pages/          # Screen widgets
│       │   └── widgets/        # Reusable UI components
│       ├── android/            # Android-specific
│       ├── ios/                # iOS-specific
│       └── pubspec.yaml
│
├── supabase/                   # Shared Backend
│   ├── functions/              # 69 Edge Functions
│   │   ├── _shared/            # Common utilities (CORS, auth, validation)
│   │   ├── workspace-*/        # Organizer workspace functions
│   │   ├── participant-*/      # Participant-facing functions
│   │   └── [feature]-*/        # Feature-specific functions
│   ├── migrations/             # Database migrations
│   └── config.toml             # Function configuration
│
└── docs/                       # Cross-platform documentation
    ├── LLM_DEVELOPMENT_GUIDE.md      # This file
    ├── MODEL_PARITY.md               # TypeScript <-> Dart mappings
    ├── EDGE_FUNCTION_REGISTRY.md     # All functions documented
    └── WORKSPACE_CHANNEL_WORKFLOW.md # Registration -> Channel flow
```

---

## Cross-Platform Development Patterns

### Pattern 1: Adding a Feature to Both Apps

When implementing a feature that spans both apps, follow this order:

#### Step 1: Database Schema (if needed)
```sql
-- File: supabase/migrations/YYYYMMDD_feature_name.sql
CREATE TABLE public.feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  -- columns
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Always add RLS
ALTER TABLE public.feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON public.feature_table FOR SELECT
  USING (auth.uid() = user_id);
```

#### Step 2: Edge Function (shared API)
```typescript
// File: supabase/functions/feature-name/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, validateAuth, errorResponse, successResponse } from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await validateAuth(req);
  if (!auth.authenticated) {
    return errorResponse('Unauthorized', 401, corsHeaders);
  }

  // Business logic here
  return successResponse({ data: result }, corsHeaders);
});
```

#### Step 3: React Implementation
```typescript
// File: apps/web/src/hooks/useFeatureName.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureName = (id: string) => {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('feature-name', {
        body: { id }
      });
      if (error) throw error;
      return data;
    }
  });
};
```

```tsx
// File: apps/web/src/components/feature/FeatureComponent.tsx
import { useFeatureName } from '@/hooks/useFeatureName';

export const FeatureComponent = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useFeatureName(id);
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  
  return <div>{/* Render data */}</div>;
};
```

#### Step 4: Flutter Implementation
```dart
// File: apps/mobile/lib/models/feature_name.dart
class FeatureName {
  final String id;
  final String userId;
  final DateTime createdAt;

  FeatureName({
    required this.id,
    required this.userId,
    required this.createdAt,
  });

  factory FeatureName.fromJson(Map<String, dynamic> json) {
    return FeatureName(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'created_at': createdAt.toIso8601String(),
  };
}
```

```dart
// File: apps/mobile/lib/repositories/supabase_feature_repository.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseFeatureRepository {
  final SupabaseClient _client;
  
  SupabaseFeatureRepository(this._client);

  Future<FeatureName> getFeature(String id) async {
    final response = await _client.functions.invoke(
      'feature-name',
      body: {'id': id},
    );
    
    if (response.status != 200) {
      throw Exception('Failed to fetch feature');
    }
    
    return FeatureName.fromJson(response.data);
  }
}
```

```dart
// File: apps/mobile/lib/providers/feature_provider.dart
import 'package:flutter/foundation.dart';

class FeatureProvider extends ChangeNotifier {
  final SupabaseFeatureRepository _repository;
  
  FeatureName? _feature;
  bool _isLoading = false;
  String? _error;

  FeatureProvider(this._repository);

  Future<void> loadFeature(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _feature = await _repository.getFeature(id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

---

### Pattern 2: Real-time Features

Both apps support Supabase Realtime for live updates.

#### Web (React)
```typescript
// Subscribe to channel messages
useEffect(() => {
  const channel = supabase
    .channel(`channel-${channelId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'channel_messages',
      filter: `channel_id=eq.${channelId}`
    }, (payload) => {
      queryClient.invalidateQueries(['messages', channelId]);
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [channelId]);
```

#### Mobile (Flutter)
```dart
// Subscribe to channel messages
void _subscribeToMessages() {
  _channel = _client
    .channel('channel-$channelId')
    .onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'channel_messages',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'channel_id',
        value: channelId,
      ),
      callback: (payload) {
        _handleNewMessage(payload.newRecord);
      },
    )
    .subscribe();
}
```

---

### Pattern 3: Authentication Flow

Both apps use the same Supabase Auth but with different UI implementations.

#### Shared Auth States
- `SIGNED_OUT` - No user session
- `SIGNED_IN` - Active session
- `PASSWORD_RECOVERY` - Reset flow active

#### Web Auth Hook
```typescript
// apps/web/src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, signIn, signOut };
};
```

#### Mobile Auth Service
```dart
// apps/mobile/lib/services/auth_service.dart
class AuthService extends ChangeNotifier {
  User? get currentUser => _client.auth.currentUser;

  Future<void> signIn(String email, String password) async {
    await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
    notifyListeners();
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    notifyListeners();
  }
}
```

---

## Edge Function Development

### Shared Utilities (`_shared/`)

All edge functions should use the shared security utilities:

```typescript
import {
  corsHeaders,           // CORS headers for web requests
  validateAuth,          // Validate JWT and extract user
  checkRateLimit,        // Rate limiting by user/endpoint
  validateUUID,          // UUID validation
  sanitizeString,        // Input sanitization
  errorResponse,         // Standardized error response
  successResponse,       // Standardized success response
  logSecurityEvent,      // Security audit logging
} from "../_shared/security.ts";
```

### Function Template

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  errorResponse,
  successResponse,
} from "../_shared/security.ts";

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // 3. Rate limiting
    const rateCheck = checkRateLimit(auth.userId!, 'function-name', {
      maxRequests: 60,
      windowMs: 60000
    });
    if (!rateCheck.allowed) {
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // 4. Input validation
    const body = await req.json();
    // Validate body...

    // 5. Business logic
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 6. Return response
    return successResponse({ data: result }, corsHeaders);

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
```

---

## Database Conventions

### Table Naming
- Use `snake_case` for table and column names
- Prefix with feature area: `workspace_`, `event_`, `participant_`
- Junction tables: `user_workspaces`, `channel_members`

### Common Columns
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
user_id UUID REFERENCES auth.users(id) -- for user-owned data
workspace_id UUID REFERENCES workspaces(id) -- for workspace-scoped data
```

### RLS Policy Patterns

#### User-owned data
```sql
CREATE POLICY "Users can CRUD their own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

#### Workspace-scoped data
```sql
CREATE POLICY "Workspace members can view"
  ON table_name FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### Public read, authenticated write
```sql
CREATE POLICY "Anyone can view" ON table_name FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Common Tasks

### Adding a New Database Table
1. Create migration: `supabase/migrations/YYYYMMDD_table_name.sql`
2. Add RLS policies
3. Update TypeScript types (auto-generated on deploy)
4. Create Dart model in `apps/mobile/lib/models/`

### Adding a New Edge Function
1. Create folder: `supabase/functions/function-name/`
2. Create `index.ts` using template above
3. Add to `supabase/config.toml`:
   ```toml
   [functions.function-name]
   verify_jwt = false
   ```
4. Test locally: `supabase functions serve function-name`

### Adding a New Route (Web)
1. Create page component in `apps/web/src/pages/`
2. Add route to `apps/web/src/components/routing/AppRouter.tsx`
3. Add navigation link to sidebar/nav

### Adding a New Screen (Mobile)
1. Create page widget in `apps/mobile/lib/pages/`
2. Add route to `apps/mobile/lib/nav.dart`
3. Add navigation from appropriate parent screen

---

## Testing

### Web Testing
```bash
cd apps/web
bun run vitest        # Run tests
bun run vitest --run  # Run once (CI)
bun run tsc --noEmit  # Type check
```

### Mobile Testing
```bash
cd apps/mobile
flutter test          # Run all tests
flutter analyze       # Static analysis
flutter build web     # Verify build
```

### Edge Function Testing
```bash
supabase functions serve function-name --env-file .env.local
# Then test with curl or HTTP client
```

---

## Debugging

### Web Console Logs
- Check browser DevTools Console
- Network tab for API failures
- React Query DevTools for cache state

### Mobile Debugging
- Flutter DevTools
- `print()` statements (visible in debug console)
- `flutter logs` for device logs

### Edge Function Logs
- Supabase Dashboard → Functions → [function-name] → Logs
- Or use CLI: `supabase functions logs function-name`

---

## Related Documentation

- [Model Parity Guide](./MODEL_PARITY.md) - TypeScript ↔ Dart mappings
- [Edge Function Registry](./EDGE_FUNCTION_REGISTRY.md) - All 69 functions documented
- [Workspace Channel Workflow](./WORKSPACE_CHANNEL_WORKFLOW.md) - Registration → Communication flow
- [Flutter Architecture](../apps/mobile/ARCHITECTURE_OVERVIEW.md) - Mobile app architecture
