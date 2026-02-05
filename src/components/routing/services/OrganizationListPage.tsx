import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Calendar, 
  Settings, 
  ExternalLink, 
  Plus, 
  Search,
  ChevronRight,
  BadgeCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import MembershipBadge from '@/components/organization/MembershipBadge';
import { NetworkingPeople, ThinkingPerson } from '@/components/illustrations';

interface OrganizationListPageProps {
  filterBy?: 'all' | 'managed' | 'member';
}

interface OrganizationListRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  role: 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'VIEWER' | 'UNKNOWN';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED' | 'UNKNOWN';
  memberCount: number;
  eventCount: number;
  followerCount: number;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  lastActivity: string;
  description?: string | null;
  logoUrl?: string | null;
}

const categoryColors: Record<string, string> = {
  COMPANY: 'bg-info/10 text-info border-info/20',
  COLLEGE: 'bg-primary/10 text-primary border-purple-500/20',
  INDUSTRY: 'bg-warning/10 text-warning border-warning/20',
  NON_PROFIT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const VerificationIcon = ({ status }: { status: string }) => {
  if (status === 'VERIFIED') {
    return <BadgeCheck className="h-4 w-4 text-emerald-500" />;
  }
  if (status === 'PENDING') {
    return <Clock className="h-4 w-4 text-warning" />;
  }
  return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
};

export const OrganizationListPage: React.FC<OrganizationListPageProps> = ({
  filterBy = 'all',
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const {
    organizations,
    managedOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
    isLoadingEvents,
  } = useOrganizerOrganizations();

  const { data: myMemberships } = useMyOrganizationMemberships();

  const organizationsWithMetrics: OrganizationListRow[] = useMemo(() => {
    if (!organizations) return [];

    return organizations.map((org) => {
      const isManaged = managedOrganizations.some((m) => m.id === org.id);
      const analytics = perOrgAnalytics[org.id] ?? { totalEvents: 0 };
      const membership = (myMemberships || []).find(
        (m: any) => m.organization_id === org.id,
      );

      const role = (membership?.role as OrganizationListRow['role'])
        || (isManaged ? 'OWNER' : 'VIEWER');
      const status = (membership?.status as OrganizationListRow['status'])
        || (isManaged ? 'ACTIVE' : 'UNKNOWN');

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        category: org.category,
        role,
        status,
        memberCount: 0,
        eventCount: analytics.totalEvents,
        followerCount: 0,
        verificationStatus: 'VERIFIED',
        lastActivity: org.created_at,
        description: null,
        logoUrl: null,
      };
    });
  }, [organizations, managedOrganizations, perOrgAnalytics, myMemberships]);

  const filteredOrganizations = useMemo(() => {
    let filtered = organizationsWithMetrics;
    
    if (filterBy === 'managed') {
      filtered = filtered.filter((org) =>
        ['OWNER', 'ADMIN', 'ORGANIZER'].includes(org.role),
      );
    } else if (filterBy === 'member') {
      filtered = filtered.filter((org) => org.status === 'ACTIVE');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.category.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [filterBy, organizationsWithMetrics, searchQuery]);

  const isLoading = isLoadingOrganizations || isLoadingEvents;

  const getPageTitle = () => {
    switch (filterBy) {
      case 'managed':
        return 'Managed Organizations';
      case 'member':
        return 'Member Organizations';
      default:
        return 'All Organizations';
    }
  };

  const getPageSubtitle = () => {
    switch (filterBy) {
      case 'managed':
        return 'Organizations where you have administrative access';
      case 'member':
        return 'Organizations where you are a member';
      default:
        return 'All organizations you belong to';
    }
  };

  const canManage = (role: string) => ['OWNER', 'ADMIN', 'ORGANIZER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/dashboard/organizations/create')}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 p-4">
              <div className="text-2xl font-bold text-foreground">
                {organizationsWithMetrics.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Organizations</div>
            </div>
            <div className="rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 p-4">
              <div className="text-2xl font-bold text-foreground">
                {organizationsWithMetrics.filter((o) => canManage(o.role)).length}
              </div>
              <div className="text-xs text-muted-foreground">You Manage</div>
            </div>
            <div className="rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 p-4">
              <div className="text-2xl font-bold text-foreground">
                {organizationsWithMetrics.reduce((acc, o) => acc + o.eventCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search organizations by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Organization Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <Card className="border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {searchQuery ? (
              <ThinkingPerson size="sm" showBackground={false} />
            ) : (
              <NetworkingPeople size="sm" showBackground={false} />
            )}
            <h3 className="text-lg font-semibold text-foreground mt-4">No organizations found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first organization to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/dashboard/organizations/create')}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((org, index) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="group border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Logo/Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {org.name}
                        </h3>
                        <VerificationIcon status={org.verificationStatus} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${categoryColors[org.category] || 'bg-muted text-muted-foreground'}`}
                        >
                          {org.category.replace('_', ' ')}
                        </Badge>
                        <MembershipBadge role={org.role} status={org.status} />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium text-foreground">{org.memberCount}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium text-foreground">{org.eventCount}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium text-foreground">{org.followerCount}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Followers</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => navigate(`/${org.slug}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Page
                    </Button>
                    {canManage(org.role) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => navigate(`/${org.slug}/organizations/members`)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          Team
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => navigate(`/${org.slug}/settings`)}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8"
                      onClick={() => navigate(`/${org.slug}/dashboard`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationListPage;
