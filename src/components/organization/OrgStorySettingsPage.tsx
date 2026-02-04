import React from 'react';
import { useCurrentOrganization } from './OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgTestimonialsManager } from './OrgTestimonialsManager';
import { OrgSponsorsManager } from './OrgSponsorsManager';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';

export const OrgStorySettingsPage: React.FC = () => {
  const organization = useCurrentOrganization();

  return (
    <OrgPageWrapper>
      <section>
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
              href: `/${organization.slug}/settings/dashboard`,
            },
            {
              label: 'Story',
              isCurrent: true,
            },
          ]}
          className="mb-3 text-xs sm:text-sm"
        />
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[140px] sm:min-h-[180px] animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Story settings</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Story &amp; social proof
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Curate testimonials and sponsors that appear on the public page for
                <span className="font-semibold"> {organization.name}</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-12 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-border/70">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Testimonials</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Quotes from participants, partners, and collaborators.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <OrgTestimonialsManager />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/70">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Sponsors &amp; partners</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Logos and links shown on your public organization page.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <OrgSponsorsManager />
          </CardContent>
        </Card>
      </section>
    </OrgPageWrapper>
  );
};
