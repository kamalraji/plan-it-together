import { FC, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';

interface RoleInfo {
  label: 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'VIEWER';
  title: string;
  description: string;
}

const ROLE_INFOS: RoleInfo[] = [
  {
    label: 'OWNER',
    title: 'Owner',
    description:
      'Full control over this organization. Can manage billing, settings, members, events, and workspaces.',
  },
  {
    label: 'ADMIN',
    title: 'Admin',
    description:
      'Can manage members, events, and workspaces for this organization, but cannot transfer ownership.',
  },
  {
    label: 'ORGANIZER',
    title: 'Organizer',
    description:
      'Can create and manage events and related workspaces within this organization.',
  },
  {
    label: 'VIEWER',
    title: 'Viewer',
    description:
      'Read-only access to events and dashboards that have been shared with them in this organization.',
  },
];

export const OrgRoleAccessBanner: FC = () => {
  const { user } = useAuth();
  const organization = useCurrentOrganization();
  const { data: memberships, isLoading } = useMyOrganizationMemberships();

  const activeMembership = useMemo(() => {
    if (!memberships || !organization?.id) return undefined;
    return memberships.find(
      (m: any) => m.organization_id === organization.id && m.status === 'ACTIVE',
    );
  }, [memberships, organization?.id]);

  const currentRole = activeMembership?.role as RoleInfo['label'] | undefined;

  if (!user || !organization) return null;

  return (
    <section className="mb-4 sm:mb-6">
      <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground/80 mb-1">
              Access in this organization
            </p>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              {organization.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              These are the permissions for each role in this organization. Your current access is highlighted.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Checking your role…</span>
              </div>
            ) : currentRole ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-primary">
                Your role: {currentRole}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] sm:text-xs font-medium text-muted-foreground">
                Role not assigned yet
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {ROLE_INFOS.map((role) => {
            const isCurrent = role.label === currentRole;
            return (
              <div
                key={role.label}
                className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm transition-colors ${
                  isCurrent
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 bg-background/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {role.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                      Your current role
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground mb-0.5">{role.title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
