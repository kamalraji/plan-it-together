import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Briefcase, Calendar, RefreshCw } from 'lucide-react';
import { useAudienceDemographics, DEFAULT_DEMOGRAPHICS, type AudienceDemographic } from '@/hooks/useSocialMediaData';

interface AudienceInsightsProps {
  workspaceId?: string;
}

export function AudienceInsights({ workspaceId }: AudienceInsightsProps) {
  const { data: demographics, isLoading, error } = useAudienceDemographics(workspaceId);

  // Use defaults if no data
  const ageGroups = demographics?.age && demographics.age.length > 0 
    ? demographics.age 
    : DEFAULT_DEMOGRAPHICS.age.map((d, i) => ({
        ...d,
        id: `default-age-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AudienceDemographic));

  const topLocations = demographics?.location && demographics.location.length > 0 
    ? demographics.location 
    : DEFAULT_DEMOGRAPHICS.location.map((d, i) => ({
        ...d,
        id: `default-loc-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AudienceDemographic));

  const industries = demographics?.industry && demographics.industry.length > 0 
    ? demographics.industry 
    : DEFAULT_DEMOGRAPHICS.industry.map((d, i) => ({
        ...d,
        id: `default-ind-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AudienceDemographic));

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg font-semibold">Audience Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 mb-3" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg font-semibold">Audience Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>Failed to load demographics</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-semibold">Audience Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Age Distribution</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            {ageGroups.map((group) => (
              <div
                key={group.id}
                className={group.color || 'bg-muted'}
                style={{ width: `${group.value}%` }}
                title={`${group.label}: ${group.value}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {ageGroups.map((group) => (
              <span key={group.id}>
                {group.label}: {Math.round(group.value)}%
              </span>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Top Locations</span>
          </div>
          <div className="space-y-2">
            {topLocations.map((location) => (
              <div key={location.id} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{location.label}</span>
                <Progress value={location.value} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground w-10 text-right">
                  {Math.round(location.value)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Industries</span>
          </div>
          <div className="space-y-2">
            {industries.map((industry) => (
              <div key={industry.id} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{industry.label}</span>
                <Progress value={industry.value} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground w-10 text-right">
                  {Math.round(industry.value)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
