import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';

export const OrganizerSpecificDashboard: FC = () => {
  const { user } = useAuth();
  const { data: memberOrganizations, isLoading } = useMyMemberOrganizations();

  const hasOrganizations = !!memberOrganizations && memberOrganizations.length > 0;

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
          <div className="relative px-4 sm:px-10 py-5 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Organizer console</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Organizer Home
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                {`Welcome${user?.name ? `, ${user.name}` : ''}. Start by creating or joining an organization, then open its dashboard to manage events and workspaces.`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                <Link
                  to="/organizations/create"
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Create organization
                </Link>
                <Link
                  to="/dashboard/organizations/join"
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
                >
                  Join organization
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization list / zero state */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : hasOrganizations ? (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
              Your organizations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {memberOrganizations!.map((org) => (
                <div
                  key={org.id}
                  className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 truncate">
                      {org.name}
                    </h3>
                    {org.category && (
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                        {org.category.toLowerCase()}
                      </p>
                    )}
                    {org.slug && (
                      <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">/{org.slug}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/${org.slug}/dashboard`}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Open dashboard
                    </Link>
                    <Link
                      to={`/${org.slug}/settings/dashboard`}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-border/70 bg-background/80 text-foreground hover:bg-background/90 transition-colors"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="max-w-3xl">
            <div className="bg-card border border-dashed border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                No organizations yet
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Create a new organization for your team or join an existing one to access full organizer
                tools, event management, and workspace collaboration.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/organizations/create"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create organization
                </Link>
                <Link
                  to="/dashboard/organizations/join"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-border/70 bg-background/80 text-foreground hover:bg-background/90 transition-colors"
                >
                  Join existing org
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
