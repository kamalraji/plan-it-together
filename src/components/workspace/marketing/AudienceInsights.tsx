import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, MapPin, Briefcase, Calendar } from 'lucide-react';

interface DemographicStat {
  label: string;
  value: number;
  color: string;
}

const ageGroups: DemographicStat[] = [
  { label: '18-24', value: 18, color: 'bg-pink-500' },
  { label: '25-34', value: 42, color: 'bg-blue-500' },
  { label: '35-44', value: 28, color: 'bg-emerald-500' },
  { label: '45-54', value: 8, color: 'bg-amber-500' },
  { label: '55+', value: 4, color: 'bg-purple-500' },
];

const topLocations = [
  { name: 'Chennai', percent: 35 },
  { name: 'Bangalore', percent: 25 },
  { name: 'Mumbai', percent: 18 },
  { name: 'Delhi', percent: 12 },
  { name: 'Other', percent: 10 },
];

const industries = [
  { name: 'Technology', percent: 45 },
  { name: 'Finance', percent: 20 },
  { name: 'Education', percent: 15 },
  { name: 'Healthcare', percent: 12 },
  { name: 'Other', percent: 8 },
];

export function AudienceInsights() {
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
                key={group.label}
                className={`${group.color}`}
                style={{ width: `${group.value}%` }}
                title={`${group.label}: ${group.value}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {ageGroups.map((group) => (
              <span key={group.label}>
                {group.label}: {group.value}%
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
              <div key={location.name} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{location.name}</span>
                <Progress value={location.percent} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground w-10 text-right">
                  {location.percent}%
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
              <div key={industry.name} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{industry.name}</span>
                <Progress value={industry.percent} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground w-10 text-right">
                  {industry.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
