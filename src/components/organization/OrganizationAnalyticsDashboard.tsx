import React from 'react';
import { useCurrentOrganization } from './OrganizationContext';
import { useOrganizationAnalytics, useOrganizationEvents } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UsersIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';

interface OrganizationAnalyticsDashboardProps {
  organizationId?: string;
}

export const OrganizationAnalyticsDashboard: React.FC<OrganizationAnalyticsDashboardProps> = () => {
  const organization = useCurrentOrganization();
  const { data: analytics, isLoading: analyticsLoading } = useOrganizationAnalytics(organization?.id);
  const { data: events } = useOrganizationEvents(organization?.id);

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const stats = [
    { title: 'Total Events', value: events?.length || 0, icon: CalendarIcon, color: 'text-blue-600' },
    { title: 'Total Participants', value: analytics?.totalRegistrations || 0, icon: UsersIcon, color: 'text-green-600' },
    { title: 'Active Events', value: events?.filter((e: any) => e.status === 'PUBLISHED').length || 0, icon: TrophyIcon, color: 'text-purple-600' },
    { title: 'Completed', value: events?.filter((e: any) => e.status === 'COMPLETED').length || 0, icon: CheckCircleIcon, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <OrganizationBreadcrumbs
          items={[
            {
              label: organization?.name ?? 'Organization',
              href: organization?.slug ? `/${organization.slug}` : undefined,
              icon: (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {organization?.name?.charAt(0).toUpperCase()}
                </span>
              ),
            },
            {
              label: 'Analytics',
              isCurrent: true,
            },
          ]}
          className="text-xs"
        />
        <h2 className="text-xl sm:text-2xl font-bold">Organization Analytics</h2>
        <p className="text-sm text-muted-foreground">Performance metrics for {organization?.name}</p>
      </div>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
