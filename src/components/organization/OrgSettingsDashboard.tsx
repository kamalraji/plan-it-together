import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';

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
  const storySettingsPath = `/${organization.slug}/settings/story`;

  return (
    <OrgPageWrapper>
      {/* Breadcrumb */}
      <OrganizationBreadcrumbs
        items={[
            {
              label: organization.name,
              href: `/${organization.slug}`,
              icon: (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              ),
            },
            {
              label: 'Settings',
            },
            {
              label: 'Organization',
              isCurrent: true,
            },
          ]}
          className="text-xs sm:text-sm mb-4"
        />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-12 pb-8 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
          {/* Organization profile */}
          <Link
            to={orgSettingsPath}
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
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
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
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

          {/* Story & social proof */}
          <Link
            to={storySettingsPath}
            className="group bg-card border border-border/70 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-5 flex flex-col gap-2 hover-scale"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Story & social proof</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">Testimonials & sponsors</p>
              </div>
              <span className="text-lg sm:text-xl">✨</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage the testimonials and sponsor logos shown on your public organization page.
            </p>
            <span className="mt-1 text-xs sm:text-sm font-medium text-primary story-link">
              Open story settings
            </span>
          </Link>
        </div>
      </section>
    </OrgPageWrapper>
  );
};
