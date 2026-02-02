
# Monorepo Restructure & LLM-Friendly Development Guide

## Overview

This plan addresses two critical needs:

1. **Repository Restructure**: Consolidate duplicate Supabase backends into a single source of truth
2. **LLM-Friendly Guide**: Create comprehensive documentation for AI-assisted development across both React web and Flutter mobile apps

---

## Current Problems Identified

### Critical: Duplicate Supabase Infrastructure

```
Current Structure (PROBLEMATIC):
/
├── supabase/                              # Web app Supabase (214 migrations, 50 functions)
│   ├── migrations/
│   └── functions/
│       └── (50 functions - workspace, channels, etc.)
│
└── flutter-participant-mobile-app/
    └── supabase/                          # Mobile app Supabase (107 migrations, 19 functions)
        ├── migrations/
        └── functions/
            └── (19 functions - agora, push, AI matching, etc.)
```

**Issues:**
- Same `project_id = "ltsniuflqfahdcirrmjh"` in both `config.toml` files
- Migrations in different folders will conflict when deployed
- Functions are split across two folders (cannot deploy together)
- LLM context is fragmented when making cross-platform changes

---

## Phase 1: Repository Restructure

### Target Structure

```
/
├── apps/
│   ├── web/                               # React Organizer Web App
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/                            # Flutter Participant Mobile App
│       ├── lib/
│       ├── android/
│       ├── ios/
│       ├── web/
│       └── pubspec.yaml
│
├── supabase/                              # SINGLE Supabase Backend (consolidated)
│   ├── functions/                         # ALL edge functions (69 total)
│   │   ├── _shared/
│   │   ├── workspace-channels/
│   │   ├── participant-channels-api/
│   │   ├── agora-token/
│   │   ├── send-push-notification/
│   │   └── ... (all functions)
│   ├── migrations/                        # ALL migrations (merged + deduplicated)
│   └── config.toml                        # Single config
│
├── packages/                              # Shared code (future)
│   └── api-contracts/                     # TypeScript types for API contracts
│
├── docs/                                  # Cross-platform documentation
│   ├── LLM_DEVELOPMENT_GUIDE.md           # Master LLM reference
│   ├── MODEL_PARITY.md                    # TypeScript <-> Dart models
│   ├── EDGE_FUNCTION_REGISTRY.md          # All functions documented
│   ├── WORKSPACE_CHANNEL_WORKFLOW.md      # Registration -> Channel flow
│   └── ARCHITECTURE_OVERVIEW.md           # System architecture
│
├── .github/
│   └── workflows/
│       ├── web.yml                        # Web CI/CD (triggers on apps/web/**)
│       ├── mobile.yml                     # Mobile CI/CD (triggers on apps/mobile/**)
│       └── supabase.yml                   # Supabase CI/CD (triggers on supabase/**)
│
└── README.md                              # Monorepo overview
```

### Migration Steps

**Step 1.1: Create `apps/` directory structure**
- Move `src/`, `public/`, `package.json`, `vite.config.ts`, `tsconfig.json` to `apps/web/`
- Move `flutter-participant-mobile-app/` contents to `apps/mobile/`

**Step 1.2: Consolidate Supabase folders**
- Keep root `supabase/` as canonical
- Merge functions from `flutter-participant-mobile-app/supabase/functions/` into `supabase/functions/`
  - Functions to merge: `agora-token`, `send-push-notification`, `track-interaction`, `generate-profile-embedding`, `get-ai-matches`, `process-embedding-queue`, `analyze-profile-match`, etc. (19 functions)
- Merge and deduplicate migrations (careful date ordering)

**Step 1.3: Update config.toml**
- Consolidate all function definitions into single `supabase/config.toml`

**Step 1.4: Update import paths**
- Update `apps/web/src/integrations/supabase/client.ts`
- Update `apps/mobile/lib/supabase/supabase_config.dart`

**Step 1.5: Update CI/CD workflows**
- Modify `.github/workflows/ci.yml` to handle monorepo paths

---

## Phase 2: LLM-Friendly Development Guide

### 2.1 Master Guide (`docs/LLM_DEVELOPMENT_GUIDE.md`)

```markdown
---
llm_metadata:
  project: thittam1hub
  apps: [react-web, flutter-mobile]
  backend: supabase
  version: 1.0.0
  last_updated: 2026-02-02
---

# LLM Development Guide for Thittam1Hub

## Quick Start for AI Assistants

### Project Context
- **Web App**: React/TypeScript organizer dashboard at `apps/web/`
- **Mobile App**: Flutter participant app at `apps/mobile/`
- **Backend**: Shared Supabase at `supabase/`

### Key Entry Points
| App | Entry | Router | State |
|-----|-------|--------|-------|
| Web | `apps/web/src/main.tsx` | `AppRouter.tsx` | TanStack Query + Zustand |
| Mobile | `apps/mobile/lib/main.dart` | `nav.dart` (GoRouter) | Provider + ChangeNotifier |

### Shared Backend
| Resource | Location | Purpose |
|----------|----------|---------|
| Edge Functions | `supabase/functions/` | API endpoints |
| Migrations | `supabase/migrations/` | Schema changes |
| Types | `apps/web/src/integrations/supabase/types.ts` | TypeScript types |
| Dart Models | `apps/mobile/lib/models/` | Dart data classes |
```

### 2.2 Cross-Platform Patterns

```markdown
## Pattern: Adding a Feature to Both Apps

### Step 1: Database Schema (if needed)
File: `supabase/migrations/YYYYMMDD_feature_name.sql`

### Step 2: Edge Function (shared API)
File: `supabase/functions/feature-name/index.ts`
- Follow template from `_shared/validation.ts`
- Use CORS headers from `_shared/cors.ts`

### Step 3: React Implementation
Files:
- Hook: `apps/web/src/hooks/useFeatureName.ts`
- Component: `apps/web/src/components/feature/FeatureName.tsx`
- Route: Add to `apps/web/src/components/routing/AppRouter.tsx`

### Step 4: Flutter Implementation
Files:
- Model: `apps/mobile/lib/models/feature_name.dart`
- Repository: `apps/mobile/lib/repositories/supabase_feature_repository.dart`
- Service: `apps/mobile/lib/services/feature_service.dart`
- Provider: `apps/mobile/lib/providers/feature_provider.dart`
- Page: `apps/mobile/lib/pages/feature/feature_page.dart`
- Route: Add to `apps/mobile/lib/nav.dart`
```

### 2.3 Model Parity Guide (`docs/MODEL_PARITY.md`)

This document will map TypeScript interfaces to Dart classes for all shared data:

```markdown
## WorkspaceChannel

### TypeScript (React)
```typescript
interface WorkspaceChannel {
  id: string;
  workspace_id: string;
  name: string;
  type: 'general' | 'announcement' | 'private' | 'task';
  is_participant_channel: boolean;
  participant_permissions: {
    can_read: boolean;
    can_write: boolean;
  };
  created_at: string;
}
```

### Dart (Flutter)
```dart
class WorkspaceChannel {
  final String id;
  final String workspaceId;
  final String name;
  final ChannelType type;
  final bool isParticipantChannel;
  final ChannelPermissions permissions;
  final DateTime createdAt;

  factory WorkspaceChannel.fromJson(Map<String, dynamic> json) => ...
}
```
```

### 2.4 Edge Function Registry (`docs/EDGE_FUNCTION_REGISTRY.md`)

```markdown
# Edge Function Registry

## Workspace Functions (Web Only)
| Function | Method | Purpose | Auth |
|----------|--------|---------|------|
| `workspace-provision` | POST | Auto-create workspace structure | JWT + Owner |
| `workspace-channels` | GET/POST/PUT/DELETE | Channel CRUD | JWT + Workspace Role |
| `channel-messages` | GET/POST | Message management | JWT + Channel Member |
| `workspace-analytics` | GET | Dashboard metrics | JWT + Manager |

## Participant Functions (Mobile + Web)
| Function | Method | Purpose | Auth |
|----------|--------|---------|------|
| `participant-channels-api` | GET | List participant channels | JWT |
| `participant-messages-api` | GET/POST | Read/write messages | JWT |
| `agora-token` | POST | RTC token for voice/video | JWT |
| `send-push-notification` | POST | FCM/APNs delivery | Service Role |

## AI Matching Functions (Mobile)
| Function | Method | Purpose | Auth |
|----------|--------|---------|------|
| `track-interaction` | POST | Log user interactions | JWT |
| `generate-profile-embedding` | POST | Create ML embeddings | Service Role |
| `get-ai-matches` | GET | Retrieve match suggestions | JWT |
| `analyze-profile-match` | POST | Deep match analysis | JWT |
```

### 2.5 Workspace Channel Workflow (`docs/WORKSPACE_CHANNEL_WORKFLOW.md`)

Complete documentation of the registration-to-channel flow:

```markdown
# Participant Communication Workflow

## Flow Diagram

```
Participant Registration (Web/Mobile)
        ↓
    Status: PENDING
        ↓
Payment/Approval Complete
        ↓
    Status: CONFIRMED
        ↓
┌───────────────────────────────────┐
│ Database Trigger Fires:           │
│ auto_join_participant_channels()  │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│ Participant added to:             │
│ - channel_members (for realtime)  │
│ - participant_channels (for API)  │
└───────────────────────────────────┘
        ↓
    ┌─────────┴─────────┐
    ↓                   ↓
┌───────┐           ┌────────┐
│  Web  │           │ Mobile │
│ Event │           │  App   │
│ Page  │           │        │
└───────┘           └────────┘
```

## API Endpoints

### Mobile: List Channels
```
GET /participant-channels-api?eventId=uuid

Response:
{
  "channels": [...],
  "unread_total": 5
}
```

### Mobile: Get Messages
```
GET /participant-messages-api?channelId=uuid&limit=50&cursor=uuid

Response:
{
  "messages": [...],
  "next_cursor": "uuid"
}
```

### Web: Organizer Broadcast
```
POST /channel-messages
{
  "channel_id": "uuid",
  "content": "Welcome!",
  "is_broadcast": true
}
```
```

---

## Phase 3: CI/CD Updates

### 3.1 Web Workflow (`web.yml`)

```yaml
name: Web CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'supabase/**'
  pull_request:
    paths:
      - 'apps/web/**'

defaults:
  run:
    working-directory: apps/web

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run tsc --noEmit
      - run: bun run vitest --run
      - run: bun run build
```

### 3.2 Mobile Workflow (`mobile.yml`)

```yaml
name: Mobile CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'
      - 'supabase/**'
  pull_request:
    paths:
      - 'apps/mobile/**'

defaults:
  run:
    working-directory: apps/mobile

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.38.7'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
      - run: flutter build web
```

### 3.3 Supabase Workflow (`supabase.yml`)

```yaml
name: Supabase CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
      - run: supabase db push
      - run: supabase functions deploy --all
```

---

## Phase 4: File Consolidation Details

### 4.1 Functions to Merge (from mobile to root)

| Function | Current Location | Purpose | Used By |
|----------|-----------------|---------|---------|
| `agora-token` | mobile | RTC tokens | Mobile |
| `analyze-profile-match` | mobile | AI matching | Mobile |
| `check-password-breach` | mobile | Security | Mobile |
| `export-user-data` | mobile | GDPR export | Mobile |
| `generate-profile-embedding` | mobile | AI embeddings | Mobile |
| `geo-anomaly-check` | mobile | Security | Mobile |
| `get-ai-matches` | mobile | AI suggestions | Mobile |
| `giphy-proxy` | mobile | GIF search | Mobile |
| `link-preview` | mobile | URL previews | Mobile |
| `login-alert` | mobile | Security | Mobile |
| `organizer-application-notification` | mobile | Notifications | Mobile |
| `process-embedding-queue` | mobile | AI background | Mobile |
| `send-push-notification` | mobile | Push delivery | Mobile |
| `send-session-reminders` | mobile | Reminders | Both |
| `track-interaction` | mobile | Analytics | Mobile |
| `track-material-download` | mobile | Analytics | Mobile |
| `track-route-analytics` | mobile | Analytics | Mobile |
| `trigger-chat-notification` | mobile | Chat alerts | Mobile |

### 4.2 Migration Merge Strategy

1. **Export both migration lists with timestamps**
2. **Sort chronologically across both folders**
3. **Identify duplicates** (same schema changes)
4. **Create consolidated migration folder**
5. **Test with `supabase db reset` locally**

---

## Deliverables Summary

| Deliverable | Type | Priority |
|-------------|------|----------|
| `apps/web/` directory restructure | Restructure | High |
| `apps/mobile/` directory restructure | Restructure | High |
| Consolidated `supabase/` | Restructure | Critical |
| `docs/LLM_DEVELOPMENT_GUIDE.md` | Documentation | High |
| `docs/MODEL_PARITY.md` | Documentation | High |
| `docs/EDGE_FUNCTION_REGISTRY.md` | Documentation | High |
| `docs/WORKSPACE_CHANNEL_WORKFLOW.md` | Documentation | High |
| Updated CI/CD workflows | Configuration | Medium |
| Updated import paths | Code Changes | High |

---

## Implementation Order

1. **Create documentation first** (non-breaking)
   - LLM Development Guide
   - Model Parity Reference
   - Edge Function Registry

2. **Restructure to apps/ directory** (breaking - coordinate)
   - Create apps/web and apps/mobile
   - Update all relative imports
   - Update CI/CD paths

3. **Consolidate Supabase** (critical - careful merge)
   - Merge functions
   - Merge migrations
   - Update config.toml
   - Deploy and verify

4. **Verify cross-platform functionality**
   - Test web app builds and deploys
   - Test mobile app builds
   - Test edge functions from both platforms

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking imports | Create migration script, test locally first |
| Migration conflicts | Test with fresh `supabase db reset` |
| Function deployment failures | Deploy functions one-by-one, verify each |
| Mobile build breaks | Test Flutter build before/after restructure |

---

## Next Steps

Approve this plan to proceed with:
1. Creating the LLM-friendly documentation (Phase 2)
2. Creating the directory restructure (Phase 1)
3. Consolidating Supabase infrastructure
4. Updating CI/CD workflows (Phase 3)
