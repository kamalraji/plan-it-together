import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mermaidDiagram = `graph TD
  %% Auth & Identity
  U["auth.users\\n(Supabase auth identities)"]

  %% Global App Roles (Supabase side)
  UR["user_roles\\n(Supabase table)"]
  subgraph GLOBAL_ROLES[Global app roles (Supabase enum public.app_role)]
    AR_ADMIN["admin"]
    AR_ORGANIZER["organizer"]
    AR_PARTICIPANT["participant"]
    AR_JUDGE["judge"]
    AR_VOLUNTEER["volunteer"]
    AR_SPEAKER["speaker"]
  end

  %% Organization-scoped roles
  OM["organization_memberships\\n(role enum: OWNER, ADMIN, ORGANIZER, VIEWER)"]
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
  M["mapUserRoleToAppRole()\\nbackend/src/services/role-mapping.service.ts"]

  %% Supabase helper function
  HF["public.has_role(user_id, app_role)\\nRLS helper function"]

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
  class BR_SA,BR_ORG,BR_PART,BR_JUDGE,BR_VOL,BR_SPK BACKEND_ROLES backend;`;

const roleColumns = ['SUPER_ADMIN', 'ORGANIZER', 'PARTICIPANT', 'JUDGE', 'VOLUNTEER', 'SPEAKER'] as const;

type RoleColumn = (typeof roleColumns)[number];

interface MatrixRow {
  key: string;
  label: string;
  description: string;
  roles: Partial<Record<RoleColumn, boolean>>;
}

const matrixRows: MatrixRow[] = [
  {
    key: 'events',
    label: 'Event management',
    description: 'Create, update, delete and view events',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
      PARTICIPANT: true,
      JUDGE: true,
      VOLUNTEER: true,
      SPEAKER: true,
    },
  },
  {
    key: 'registrations',
    label: 'Registration management',
    description: 'View/manage registrations beyond own records',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
    },
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Check-in participants and view attendance logs',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
      VOLUNTEER: true,
      SPEAKER: true,
    },
  },
  {
    key: 'judging',
    label: 'Judging',
    description: 'Submit and view scores for submissions',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
      JUDGE: true,
    },
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Send broadcast communications and view message history',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
    },
  },
  {
    key: 'certificates',
    label: 'Certificates',
    description: 'Generate and manage certificates',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
    },
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'View aggregate analytics dashboards',
    roles: {
      SUPER_ADMIN: true,
      ORGANIZER: true,
    },
  },
  {
    key: 'user-management',
    label: 'User management',
    description: 'High-level user and organizer approvals',
    roles: {
      SUPER_ADMIN: true,
    },
  },
];

export const RolesDiagramPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Role Model & Access Matrix | Thittam1Hub';

    const description =
      'Admin-only documentation page showing the global role model diagram and access matrix for Thittam1Hub.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 px-4 py-8 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Role Model & Access Matrix
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
            Internal documentation for SUPER_ADMIN users that combines the Supabase-level app roles, organization
            memberships, and backend roles into a single, auditable view.
          </p>
        </header>

        <section aria-labelledby="roles-diagram-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2
              id="roles-diagram-heading"
              className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2"
            >
              Mermaid role model diagram
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Copy this block into any Mermaid-compatible renderer to visualize the full role graph.
            </p>
          </div>

          <Card className="shadow-soft border-coral/20 bg-black/90 text-muted-foreground">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mermaid source (kept in sync with <code className="font-mono text-xs">docs/role-model-diagram.md</code>)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-md bg-black/80 p-4 text-xs sm:text-sm text-muted-foreground">
                <code className="language-mermaid whitespace-pre">{mermaidDiagram}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="access-matrix-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2
              id="access-matrix-heading"
              className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2"
            >
              High-level access matrix
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              This matrix summarizes which backend <span className="font-mono text-[11px]">UserRole</span> values
              receive each capability. SUPER_ADMIN implicitly has every permission.
            </p>
          </div>

          <Card className="shadow-soft border-teal/20 bg-card/90 backdrop-blur-sm">
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Capability</TableHead>
                    <TableHead className="min-w-[220px]">Description</TableHead>
                    {roleColumns.map((role) => (
                      <TableHead key={role} className="text-center text-xs sm:text-sm">
                        {role}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium text-sm text-foreground">{row.label}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        {row.description}
                      </TableCell>
                      {roleColumns.map((role) => {
                        const enabled = row.roles[role];
                        return (
                          <TableCell key={role} className="text-center">
                            {enabled ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/60 text-[10px] text-muted-foreground">
                                
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default RolesDiagramPage;
