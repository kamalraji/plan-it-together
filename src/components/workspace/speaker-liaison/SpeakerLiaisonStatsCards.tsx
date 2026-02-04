import { Card, CardContent } from '@/components/ui/card';
import { Mic, Calendar, FileCheck, Clock } from 'lucide-react';

interface SpeakerLiaisonStatsCardsProps {
  totalSpeakers: number;
  confirmedSpeakers: number;
  sessionsScheduled: number;
  pendingRequirements: number;
}

export function SpeakerLiaisonStatsCards({
  totalSpeakers = 24,
  confirmedSpeakers = 18,
  sessionsScheduled = 32,
  pendingRequirements = 7,
}: SpeakerLiaisonStatsCardsProps) {
  const stats = [
    {
      label: 'Total Speakers',
      value: totalSpeakers,
      icon: Mic,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Confirmed',
      value: confirmedSpeakers,
      icon: FileCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Sessions',
      value: sessionsScheduled,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pending Items',
      value: pendingRequirements,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
