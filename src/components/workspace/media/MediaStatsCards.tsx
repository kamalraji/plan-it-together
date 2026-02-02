import { Camera, Video, Users, FolderOpen, Award, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaStats } from '@/hooks/useStatsData';
import { Skeleton } from '@/components/ui/skeleton';

interface MediaStatsCardsProps {
  workspaceId: string;
}

export function MediaStatsCards({ workspaceId }: MediaStatsCardsProps) {
  const { data, isLoading } = useMediaStats(workspaceId);

  const stats = [
    {
      label: 'Photographers',
      value: data?.photographers ?? 0,
      icon: Camera,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Videographers',
      value: data?.videographers ?? 0,
      icon: Video,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Press Credentials',
      value: data?.pressCredentials ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
    },
    {
      label: 'Media Assets',
      value: data?.mediaAssets ?? 0,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-500/10',
    },
    {
      label: 'Coverage Hours',
      value: data?.coverageHours ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-500/10',
    },
    {
      label: 'Deliverables',
      value: data?.deliverables ?? 0,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
