import { Users, FileCheck, ClipboardList, Award, Timer, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface JudgeStatsCardsProps {
  totalJudges: number;
  totalSubmissions: number;
  evaluatedCount: number;
  pendingCount: number;
  averageScore: number;
  criteriaCount: number;
}

export function JudgeStatsCards({
  totalJudges,
  totalSubmissions,
  evaluatedCount,
  pendingCount,
  averageScore,
  criteriaCount,
}: JudgeStatsCardsProps) {
  const stats = [
    {
      label: 'Active Judges',
      value: totalJudges,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Submissions',
      value: totalSubmissions,
      icon: FileCheck,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Evaluated',
      value: evaluatedCount,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      label: 'Pending Review',
      value: pendingCount,
      icon: Timer,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
    },
    {
      label: 'Avg. Score',
      value: averageScore.toFixed(1),
      icon: Award,
      color: 'text-primary',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Scoring Criteria',
      value: criteriaCount,
      icon: ClipboardList,
      color: 'text-info',
      bgColor: 'bg-info/20',
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
