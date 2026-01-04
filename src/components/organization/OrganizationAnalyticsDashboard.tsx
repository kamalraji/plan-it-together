import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentOrganization } from './OrganizationContext';
import { useOrganizationAnalytics, useOrganizationEvents } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UsersIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { FileText, Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

const VALID_TABS = ['events', 'reports', 'export', 'daterange', 'trends'] as const;
type TabValue = typeof VALID_TABS[number];

interface OrganizationAnalyticsDashboardProps {
  organizationId?: string;
}

export const OrganizationAnalyticsDashboard: React.FC<OrganizationAnalyticsDashboardProps> = () => {
  const organization = useCurrentOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: analytics, isLoading: analyticsLoading } = useOrganizationAnalytics(organization?.id);
  const { data: events } = useOrganizationEvents(organization?.id);

  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'events';

  // Calculate detailed event metrics
  const eventMetrics = {
    totalEvents: events?.length || 0,
    activeEvents: events?.filter((e: any) => e.status === 'PUBLISHED').length || 0,
    draftEvents: events?.filter((e: any) => e.status === 'DRAFT').length || 0,
    totalRegistrations: analytics?.totalRegistrations || 0,
    upcomingEvents: events?.filter((e: any) => {
      const startDate = new Date(e.start_date);
      return startDate > new Date() && e.status === 'PUBLISHED';
    }).length || 0,
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

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
    <OrgPageWrapper className="space-y-5 sm:space-y-6">
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

      {/* Stats Overview */}
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

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="events" className="gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 hidden sm:inline" />
            Events
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="h-3.5 w-3.5 hidden sm:inline" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5">
            <Download className="h-3.5 w-3.5 hidden sm:inline" />
            Export
          </TabsTrigger>
          <TabsTrigger value="daterange" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5 hidden sm:inline" />
            Date Range
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 hidden sm:inline" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Event Metrics
              </CardTitle>
              <CardDescription>Detailed breakdown of your event statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        EV
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold text-foreground">{eventMetrics.totalEvents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                        AC
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                      <p className="text-2xl font-bold text-emerald-500">{eventMetrics.activeEvents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
                        DR
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Draft Events</p>
                      <p className="text-2xl font-bold text-amber-500">{eventMetrics.draftEvents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        RG
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                      <p className="text-2xl font-bold text-primary">{eventMetrics.totalRegistrations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                        UP
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                      <p className="text-2xl font-bold text-violet-500">{eventMetrics.upcomingEvents}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Reports
              </CardTitle>
              <CardDescription>View detailed analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-medium text-foreground mb-1">Event Performance</h4>
                  <p className="text-sm text-muted-foreground mb-3">Registration rates, attendance, and engagement metrics.</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-medium text-foreground mb-1">Member Activity</h4>
                  <p className="text-sm text-muted-foreground mb-3">Team member contributions and participation stats.</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-medium text-foreground mb-1">Revenue Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-3">Ticket sales, sponsorships, and revenue tracking.</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-medium text-foreground mb-1">Audience Insights</h4>
                  <p className="text-sm text-muted-foreground mb-3">Demographics, locations, and attendee profiles.</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download analytics data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                  <h4 className="font-medium text-foreground mb-2">Events Summary</h4>
                  <p className="text-xs text-muted-foreground mb-3">All events with key metrics</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    CSV
                  </Button>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                  <h4 className="font-medium text-foreground mb-2">Registration Data</h4>
                  <p className="text-xs text-muted-foreground mb-3">Participant details and responses</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    CSV
                  </Button>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                  <h4 className="font-medium text-foreground mb-2">Full Report</h4>
                  <p className="text-xs text-muted-foreground mb-3">Comprehensive analytics PDF</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daterange">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
              <CardDescription>Filter analytics by specific time periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Last 7 days</Button>
                <Button variant="outline" size="sm">Last 30 days</Button>
                <Button variant="outline" size="sm">Last 90 days</Button>
                <Button variant="outline" size="sm">This year</Button>
                <Button variant="outline" size="sm">All time</Button>
              </div>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Select a date range above to filter all analytics data. Custom date ranges coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth & Trends
              </CardTitle>
              <CardDescription>Track growth patterns and engagement trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Event Growth</h4>
                    <span className="text-sm text-green-600 font-medium">+12%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Events created compared to last period</p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Registration Rate</h4>
                    <span className="text-sm text-green-600 font-medium">+8%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Registrations per event average</p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Team Growth</h4>
                    <span className="text-sm text-green-600 font-medium">+5%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">New team members this period</p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Engagement Score</h4>
                    <span className="text-sm text-amber-600 font-medium">+2%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall engagement metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </OrgPageWrapper>
  );
};
