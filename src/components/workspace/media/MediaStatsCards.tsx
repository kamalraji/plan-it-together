import { Camera, Video, Users, FolderOpen, Award, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MediaStatsCardsProps {
  photographers: number;
  videographers: number;
  pressCredentials: number;
  mediaAssets: number;
  coverageHours: number;
  deliverables: number;
}

export function MediaStatsCards({
  photographers,
  videographers,
  pressCredentials,
  mediaAssets,
  coverageHours,
  deliverables,
}: MediaStatsCardsProps) {
  const stats = [
    {
      label: 'Photographers',
      value: photographers,
      icon: Camera,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Videographers',
      value: videographers,
      icon: Video,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Press Credentials',
      value: pressCredentials,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Media Assets',
      value: mediaAssets,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Coverage Hours',
      value: coverageHours,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Deliverables',
      value: deliverables,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

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
