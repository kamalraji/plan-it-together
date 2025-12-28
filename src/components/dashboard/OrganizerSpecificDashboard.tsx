import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { OrganizerOnboardingChecklist } from '@/components/organization/OrganizerOnboardingChecklist';

export function OrganizerSpecificDashboard() {
  const { user, logout } = useAuth();
  const { data: memberOrganizations, isLoading } = useMyMemberOrganizations();

  const displayName = user?.name || (user as any)?.full_name || user?.email || 'Organizer';

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">Home</span>
        <span>/</span>
        <span className="text-foreground font-medium">Organizer Home</span>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[150px] sm:min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />

          <div className="relative px-4 sm:px-10 py-4 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Organizer console</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Organizer Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Welcome back, {displayName}. Use this hub to access and manage all of your organizations.
              </p>
            </div>

            <div className="flex flex-col items-stretch xs:items-end gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-xl min-w-[220px] max-w-xs self-stretch sm:self-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Organizer account
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Select an organization below to open its full dashboard.
                </p>
              </div>

              <button
                onClick={logout}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pt-10 sm:pt-14">
        {/* Onboarding checklist keeps existing behavior for organizers */}
        <div className="mb-6">
          <OrganizerOnboardingChecklist />
        </div>

        {/* Organizations section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Your organizations</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create a new organization or jump into an existing one to see detailed analytics, events, and workspaces.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/organizations/create"
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create organization
              </Link>
              <Link
                to="/dashboard/organizations/join"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Join existing organization
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : !memberOrganizations || memberOrganizations.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 sm:p-8 space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                You don&apos;t have any organizations yet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Create your first organization to start running events, managing workspaces, and collaborating with your team.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {memberOrganizations.map((org: any) => (
                <div
                  key={org.id}
                  className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{org.name}</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{org.slug}</p>
                    </div>
                    {org.role && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                        {org.role}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {org.description || 'Open the dashboard to see events, analytics, and member activity for this organization.'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Link
                      to={`/${org.slug}/dashboard`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium py-2 hover:bg-primary/90 transition-colors"
                    >
                      Open dashboard
                    </Link>
                    <Link
                      to={`/${org.slug}/settings/dashboard`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-border text-xs sm:text-sm font-medium py-2 text-foreground hover:bg-muted transition-colors"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
