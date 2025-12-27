import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentOrganization } from './OrganizationContext';

/**
 * OrgSettingsDashboard
 *
 * High-level settings hub for an organization, scoped by orgSlug.
 * - Mirrors the glassmorphic hero from OrganizerDashboard
 * - Surfaces key settings areas with clear links to detailed pages
 */
export const OrgSettingsDashboard: React.FC = () => {
  const organization = useCurrentOrganization();

  const orgSettingsPath = `/dashboard/organizations/${organization.id}/settings`;
  const teamPath = `/${organization.slug}/team`;
  const profileSettingsPath = '/dashboard/profile/settings';

  return (
    <main className="min-h-screen bg-transparent">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">Settings</span>
        <span>/</span>
        <span className="text-foreground font-medium">Organization</span>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[140px] sm:min-h-[180px] animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

          <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Settings dashboard</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Organization settings
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Configure how <span className="font-semibold">{organization.name}</span> appears to participants, manage
                your team, and tune notification preferences.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-xl min-w-[220px] max-w-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Active organization
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">{organization.name}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{organization.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Settings cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Organization profile */}
          <Link
            to={orgSettingsPath}
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Organization profile</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">Public details & branding</p>
              </div>
              <span className="text-lg sm:text-xl">🏷️</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Edit description, contact details, website, and other information participants see.
            </p>
            <span className="mt-1 text-xs sm:text-sm font-medium text-primary story-link">
              Open organization profile
            </span>
          </Link>

          {/* Team & roles */}
          <Link
            to={teamPath}
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Team & access</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">Co-organizers & volunteers</p>
              </div>
              <span className="text-lg sm:text-xl">👥</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Invite organizers and volunteers, and manage who can access this organization.
            </p>
            <span className="mt-1 text-xs sm:text-sm font-medium text-primary story-link">
              Manage team
            </span>
          </Link>

          {/* Personal notifications & profile */}
          <Link
            to={profileSettingsPath}
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Your preferences</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">Profile & notifications</p>
              </div>
              <span className="text-lg sm:text-xl">🔔</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Adjust your personal profile, notification channels, and other per-user settings.
            </p>
            <span className="mt-1 text-xs sm:text-sm font-medium text-primary story-link">
              Open your settings
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
};
