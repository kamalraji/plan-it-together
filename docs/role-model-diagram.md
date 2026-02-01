# Role Model – Visual Overview

This document visualizes how roles work in the app across the Node backend and the Supabase database.

```mermaid
graph TD
  %% Auth & Identity
  U["auth.users<br/><small>(Supabase auth identities)</small>"]

  %% Global App Roles (Supabase side)
  UR["user_roles<br/><small>(Supabase table)</small>"]
  subgraph GLOBAL_ROLES[Global app roles (Supabase enum public.app_role)]
    AR_ADMIN["admin"]
    AR_ORGANIZER["organizer"]
    AR_PARTICIPANT["participant"]
    AR_JUDGE["judge"]
    AR_VOLUNTEER["volunteer"]
    AR_SPEAKER["speaker"]
  end

  %% Organization-scoped roles
  OM["organization_memberships<br/><small>role enum: OWNER, ADMIN, ORGANIZER, VIEWER</small>"]
  subgraph ORG_ROLES[Organization membership roles]
    OM_OWNER["OWNER"]
    OM_ADMIN["ADMIN"]
    OM_ORGANIZER["ORGANIZER"]
    OM_VIEWER["VIEWER"]
  end

  %% Node backend roles (Prisma UserRole)
  subgraph BACKEND_ROLES[Node backend (Prisma UserRole)]
    BR_SA["SUPER_ADMIN"]
    BR_ORG["ORGANIZER"]
    BR_PART["PARTICIPANT"]
    BR_JUDGE["JUDGE"]
    BR_VOL["VOLUNTEER"]
    BR_SPK["SPEAKER"]
  end

  %% Mapping layer in backend
  M["mapUserRoleToAppRole()<br/><small>backend/src/services/role-mapping.service.ts</small>"]

  %% Supabase helper function
  HF["public.has_role(user_id, app_role)<br/><small>RLS helper function</small>"]

  %% Domain tables using app_role-based RLS
  EV["events"]
  ORG["organizations"]
  REG["registrations"]
  SUB["submissions"]
  SCORES["scores"]
  WSP["workspaces"]
  WSP_TM["workspace_team_members"]
  WSP_TASKS["workspace_tasks"]
  WSP_ACT["workspace_activities"]
  CERT["certificates"]
  JASSIGN["judge_assignments"]
  UP["user_profiles"]
  NTFY["notifications & notification_preferences"]

  %% Relationships
  U -->|one-to-many| UR
  U -->|one-to-many| OM

  UR -->|role column (app_role)| GLOBAL_ROLES
  OM -->|role column (organization_membership_role)| ORG_ROLES

  %% Backend mapping: Prisma -> app_role
  BACKEND_ROLES --> M
  M -->|maps to| AR_ADMIN
  M -->|maps to| AR_ORGANIZER
  M -->|maps to| AR_PARTICIPANT
  M -->|maps to| AR_JUDGE
  M -->|maps to| AR_VOLUNTEER
  M -->|maps to| AR_SPEAKER

  %% has_role usage in RLS
  HF --> EV
  HF --> ORG
  HF --> REG
  HF --> SUB
  HF --> SCORES
  HF --> WSP
  HF --> WSP_TM
  HF --> WSP_TASKS
  HF --> WSP_ACT
  HF --> CERT
  HF --> JASSIGN
  HF --> UP
  HF --> NTFY

  %% Org role helper usage (is_org_admin_for_org)
  OM_ADMIN -->|via is_org_admin_for_org(...)| ORG
  OM_ADMIN -->|via is_org_admin_for_org(...)| organization_products
  OM_ADMIN -->|via is_org_admin_for_org(...)| organization_sponsors
  OM_ADMIN -->|via is_org_admin_for_org(...)| organization_testimonials
  OM_ADMIN -->|via is_org_admin_for_org(...)| organization_memberships

  %% Legend
  classDef table fill:#0f766e,stroke:#0f766e,stroke-width:1,color:#fff;
  classDef enum fill:#1d4ed8,stroke:#1d4ed8,stroke-width:1,color:#fff;
  classDef helper fill:#7c3aed,stroke:#7c3aed,stroke-width:1,color:#fff;
  classDef backend fill:#334155,stroke:#334155,stroke-width:1,color:#fff;

  class U,UR,OM,EV,ORG,REG,SUB,SCORES,WSP,WSP_TM,WSP_TASKS,WSP_ACT,CERT,JASSIGN,UP,NTFY table;
  class AR_ADMIN,AR_ORGANIZER,AR_PARTICIPANT,AR_JUDGE,AR_VOLUNTEER,AR_SPEAKER,OM_OWNER,OM_ADMIN,OM_ORGANIZER,OM_VIEWER enum;
  class HF M helper;
  class BR_SA,BR_ORG,BR_PART,BR_JUDGE,BR_VOL,BR_SPK BACKEND_ROLES backend;
```

**How to view this diagram**
- Open this file in a Markdown viewer that supports Mermaid (e.g., VS Code with Mermaid plugin, GitHub, or many docs tools), or
- Copy the `mermaid` block into any online Mermaid live editor to render it.
