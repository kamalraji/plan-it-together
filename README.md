# Thittam1Hub - Event Management Monorepo

React web app (organizers) + Flutter mobile app (participants) sharing a unified Supabase backend.

## Structure

```
/
├── src/                    # React Organizer Web App (Lovable-hosted)
├── apps/mobile/            # Flutter Participant Mobile App
├── supabase/               # Shared Backend (69 Edge Functions)
└── docs/                   # Cross-platform documentation
```

## Quick Start

```bash
# Web App (root level for Lovable compatibility)
bun install && bun run dev

# Mobile App
cd apps/mobile && flutter pub get && flutter run
```

## Documentation

- [LLM Development Guide](./docs/LLM_DEVELOPMENT_GUIDE.md)
- [Model Parity](./docs/MODEL_PARITY.md)
- [Edge Function Registry](./docs/EDGE_FUNCTION_REGISTRY.md)
- [Workspace Channel Workflow](./docs/WORKSPACE_CHANNEL_WORKFLOW.md)
