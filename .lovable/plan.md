# Monorepo Restructure Plan - ✅ COMPLETED

## Status: Completed on 2026-02-02

### Summary of Changes Made

The monorepo restructure has been completed with the following adjustments:

**Original Plan vs. Actual Implementation:**
- Web app kept at **root level** (`src/`) for Lovable hosting compatibility (instead of `apps/web/`)
- Mobile app moved to **`apps/mobile/`** (from `flutter-participant-mobile-app/`)
- Supabase backends **consolidated** into single `supabase/` directory

---

## Final Structure

```
/
├── src/                        # React Organizer Web App (root for Lovable)
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── lib/
│   └── integrations/
│
├── apps/
│   └── mobile/                 # Flutter Participant Mobile App
│       ├── lib/
│       ├── android/
│       ├── ios/
│       └── pubspec.yaml
│
├── supabase/                   # SINGLE Consolidated Backend
│   ├── functions/              # 69 Edge Functions (merged)
│   │   ├── _shared/            # Security utilities
│   │   ├── agora-token/        # (merged from mobile)
│   │   ├── send-push-notification/
│   │   └── ...
│   ├── migrations/
│   └── config.toml
│
├── docs/                       # LLM-Friendly Documentation
│   ├── LLM_DEVELOPMENT_GUIDE.md
│   ├── MODEL_PARITY.md
│   ├── EDGE_FUNCTION_REGISTRY.md
│   └── WORKSPACE_CHANNEL_WORKFLOW.md
│
└── .github/workflows/
    ├── web.yml                 # Triggers on src/**
    ├── mobile.yml              # Triggers on apps/mobile/**
    └── supabase.yml            # Triggers on supabase/**
```

---

## Completed Tasks

### Phase 1: Documentation Suite ✅
- [x] Created `docs/LLM_DEVELOPMENT_GUIDE.md`
- [x] Created `docs/MODEL_PARITY.md`
- [x] Created `docs/EDGE_FUNCTION_REGISTRY.md`
- [x] Created `docs/WORKSPACE_CHANNEL_WORKFLOW.md`

### Phase 2: Directory Restructure ✅
- [x] Renamed `flutter-participant-mobile-app/` to `apps/mobile/`
- [x] Web app kept at root for Lovable compatibility
- [x] Updated README.md with new structure

### Phase 3: Supabase Consolidation ✅
- [x] Merged 18 edge functions from mobile to root `supabase/functions/`
- [x] Deleted duplicate `apps/mobile/supabase/` folder
- [x] Created `supabase/functions/_shared/security.ts`
- [x] Updated `supabase/config.toml` with all function definitions

### Phase 4: CI/CD Updates ✅
- [x] Created `.github/workflows/web.yml`
- [x] Created `.github/workflows/mobile.yml` (updated paths)
- [x] Created `.github/workflows/supabase.yml`
- [x] Deleted old `.github/workflows/ci.yml`

---

## Functions Consolidated

The following 18 functions were merged from mobile supabase to root:

| Function | Purpose |
|----------|---------|
| `agora-token` | RTC tokens for voice/video |
| `analyze-profile-match` | AI deep match analysis |
| `check-password-breach` | Security check |
| `export-user-data` | GDPR data export |
| `generate-profile-embedding` | AI embeddings |
| `geo-anomaly-check` | Security |
| `get-ai-matches` | AI match suggestions |
| `giphy-proxy` | GIF search proxy |
| `link-preview` | URL preview extraction |
| `login-alert` | Security notification |
| `organizer-application-notification` | Notifications |
| `process-embedding-queue` | AI background processing |
| `send-push-notification` | FCM/APNs delivery |
| `send-session-reminders` | Session reminders |
| `track-interaction` | Analytics |
| `track-material-download` | Download analytics |
| `track-route-analytics` | Route analytics |
| `trigger-chat-notification` | Chat alerts |

---

## Notes

- **Lovable Compatibility**: The React web app must remain at root level for Lovable's preview and deployment system to work correctly.
- **Migration Deduplication**: The mobile migrations were already applied via the same Supabase project, so no migration merge was needed - they were simply cleaned up.
- **Shared Security**: All edge functions now have access to `_shared/security.ts` for CORS, JWT validation, and rate limiting.
