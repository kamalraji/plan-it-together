import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  Building2,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalOrganizations: number;
  totalVendors: number;
  pendingVendors: number;
  verifiedVendors: number;
  activeEvents: number;
  completedEvents: number;
}

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  loading?: boolean;
}> = ({ title, value, icon: Icon, description, trend, loading }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export const AdminStatisticsPanel: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      // Fetch counts in parallel
      const [
        usersResult,
        eventsResult,
        registrationsResult,
        orgsResult,
        vendorsResult,
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, status', { count: 'exact' }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id, verification_status'),
      ]);

      const events = eventsResult.data || [];
      const vendors = vendorsResult.data || [];

      return {
        totalUsers: usersResult.count || 0,
        totalEvents: eventsResult.count || events.length,
        totalRegistrations: registrationsResult.count || 0,
        totalOrganizations: orgsResult.count || 0,
        totalVendors: vendors.length,
        pendingVendors: vendors.filter(v => v.verification_status === 'PENDING').length,
        verifiedVendors: vendors.filter(v => v.verification_status === 'VERIFIED').length,
        activeEvents: events.filter(e => e.status === 'ONGOING' || e.status === 'PUBLISHED').length,
        completedEvents: events.filter(e => e.status === 'COMPLETED').length,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground text-sm">
          Key metrics and statistics for the Thittam1Hub platform.
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          description="Registered accounts"
          loading={isLoading}
        />
        <StatCard
          title="Total Events"
          value={stats?.totalEvents ?? 0}
          icon={Calendar}
          description={`${stats?.activeEvents ?? 0} active`}
          loading={isLoading}
        />
        <StatCard
          title="Registrations"
          value={stats?.totalRegistrations ?? 0}
          icon={UserCheck}
          description="Event sign-ups"
          loading={isLoading}
        />
        <StatCard
          title="Organizations"
          value={stats?.totalOrganizations ?? 0}
          icon={Building2}
          description="Registered orgs"
          loading={isLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Vendors"
          value={stats?.totalVendors ?? 0}
          icon={Building2}
          description={`${stats?.verifiedVendors ?? 0} verified`}
          loading={isLoading}
        />
        <StatCard
          title="Pending Vendors"
          value={stats?.pendingVendors ?? 0}
          icon={Clock}
          description="Awaiting review"
          loading={isLoading}
        />
        <StatCard
          title="Completed Events"
          value={stats?.completedEvents ?? 0}
          icon={CheckCircle2}
          description="Successfully finished"
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats?.pendingVendors ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      {stats?.pendingVendors} vendor application{stats?.pendingVendors !== 1 ? 's' : ''} pending
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Review and approve vendor registrations
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(stats?.pendingVendors ?? 0) === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                No pending actions at this time.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatisticsPanel;
