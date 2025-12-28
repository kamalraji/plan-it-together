import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { useVendorStatus } from '@/hooks/useVendorStatus';
import { OrganizerOnboardingChecklist } from '@/components/organization/OrganizerOnboardingChecklist';

export const OrganizerRootDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: orgs, isLoading: orgsLoading } = useMyMemberOrganizations();
  const { isVendor, isLoading: vendorLoading } = useVendorStatus(user?.id || '');
  const [activeTab, setActiveTab] = useState<'organizations' | 'events' | 'analytics' | 'marketplace' | 'profile'>(
    'organizations',
  );

  const hasOrgs = Array.isArray(orgs) && orgs.length > 0;

  const totalOrganizations = hasOrgs ? orgs.length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">Home</span>
        <span>/</span>
        <span className="text-foreground font-medium">Organizer Dashboard</span>
      </div>

      {/* Hero – organizer level (no org context required) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[150px] sm:min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />

          <div className="relative px-4 sm:px-10 py-4 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/75 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Organizer view</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Organizer Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Welcome back{user?.name ? `, ${user.name}` : ''}. From here you can create or join organizations and
                access all your organizer tools.
              </p>
            </div>

            <div className="flex flex-col items-stretch xs:items-end gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="rounded-2xl border border-border/60 bg-background/75 backdrop-blur-xl px-4 py-3 shadow-xl min-w-[220px] max-w-xs self-stretch sm:self-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Organizer summary
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {hasOrgs ? `${totalOrganizations} organization${totalOrganizations > 1 ? 's' : ''}` : 'No organizations yet'}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Create or join an organization to unlock full dashboards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                {!vendorLoading && (
                  <Link
                    to={isVendor ? '/vendor/dashboard' : '/vendor/register'}
                    className="flex-1 min-w-[120px] text-center text-[11px] sm:text-xs md:text-sm font-medium text-foreground hover:text-foreground/80 underline-offset-2 hover:underline"
                  >
                    {isVendor ? 'Vendor Dashboard' : 'Become a Vendor'}
                  </Link>
                )}
                <Link
                  to="/organizations/create"
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Create organization
                </Link>
                <button
                  onClick={logout}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-level summary metrics – organizer centric */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 sm:mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Organizations</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">{totalOrganizations}</div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">Linked to this account</span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Events</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">–</div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">View per-organization dashboards</span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Registrations</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">–</div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">Available in org dashboards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-10">
        <div className="bg-card border border-border/60 rounded-2xl px-2 sm:px-3 py-2 shadow-sm overflow-x-auto">
          <nav className="flex gap-2 sm:gap-3 min-w-max">
            {[
              { key: 'organizations', label: 'Organizations' },
              { key: 'events', label: 'Events' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'marketplace', label: 'Marketplace' },
              { key: 'profile', label: 'Profile' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pt-10 sm:pt-14">
        {/* Onboarding Checklist */}
        <div className="mb-6">
          <OrganizerOnboardingChecklist />
        </div>

        {/* Tab content – keep organization tab rich, others simple placeholders without org-specific logic */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            {!hasOrgs && !orgsLoading && (
              <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 space-y-3">
                <h2 className="text-lg font-semibold text-foreground">You don&apos;t have any organizations yet</h2>
                <p className="text-sm text-muted-foreground">
                  Create your first organization to start running events and workspaces, or request to join an
                  existing one.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/organizations/create"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Create organization
                  </Link>
                  <Link
                    to="/dashboard/organizations/join"
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Join existing organization
                  </Link>
                </div>
              </section>
            )}

            {hasOrgs && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Your organizations</h2>
                  <Link
                    to="/organizations/create"
                    className="text-xs font-medium text-primary hover:text-primary/80"
                  >
                    + Create another organization
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orgs!.map((org: any) => (
                    <article
                      key={org.id}
                      className="rounded-xl border border-border bg-card/80 p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-foreground truncate">{org.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{org.slug}</p>
                        </div>
                        {org.role && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                            {org.role}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Link
                          to={`/${org.slug}/dashboard`}
                          className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2 hover:bg-primary/90"
                        >
                          Open dashboard
                        </Link>
                        <Link
                          to={`/${org.slug}/settings/dashboard`}
                          className="flex-1 inline-flex items-center justify-center rounded-lg border border-border text-xs font-medium py-2 text-foreground hover:bg-muted"
                        >
                          Settings
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <section className="bg-card rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Events</h2>
            <p className="text-sm text-muted-foreground mb-4">
              To manage events, open an organization dashboard where you can create and monitor events specific to that
              organization.
            </p>
            <Link
              to={hasOrgs ? `/${orgs[0].slug}/dashboard` : '/organizations/create'}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              {hasOrgs ? 'Go to first organization dashboard' : 'Create organization to get started'}
            </Link>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="bg-card rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Analytics</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed analytics live inside each organization dashboard, where metrics are scoped to that
              organization&apos;s events and workspaces.
            </p>
            <Link
              to={hasOrgs ? `/${orgs[0].slug}/dashboard` : '/organizations/create'}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              {hasOrgs ? 'Open organization analytics' : 'Create organization to unlock analytics'}
            </Link>
          </section>
        )}

        {activeTab === 'marketplace' && (
          <section className="bg-card rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Marketplace</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Browse and integrate marketplace services to power your events and workspaces.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/console/services/marketplace"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Open marketplace
              </Link>
              {hasOrgs && (
                <Link
                  to={`/${orgs[0].slug}/dashboard`}
                  className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  View marketplace impact on events
                </Link>
              )}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="bg-card rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Organizer profile</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Keep your profile up to date so collaborators and participants can recognize you across organizations and
              events.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/profile/settings"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Edit profile
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                View public profile
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

