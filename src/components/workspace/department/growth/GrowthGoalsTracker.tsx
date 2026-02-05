import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar } from 'lucide-react';

interface GrowthGoal {
  id: string;
  title: string;
  category: 'reach' | 'engagement' | 'revenue' | 'audience';
  current: number;
  target: number;
  unit: string;
  dueDate: string;
  trend: number;
}

export function GrowthGoalsTracker() {
  const goals: GrowthGoal[] = [
    {
      id: '1',
      title: 'Social Media Followers',
      category: 'audience',
      current: 48200,
      target: 60000,
      unit: 'followers',
      dueDate: '2026-01-15',
      trend: 12,
    },
    {
      id: '2',
      title: 'Total Sponsorship Revenue',
      category: 'revenue',
      current: 125000,
      target: 200000,
      unit: 'USD',
      dueDate: '2026-01-20',
      trend: 8,
    },
    {
      id: '3',
      title: 'Marketing Reach',
      category: 'reach',
      current: 2400000,
      target: 5000000,
      unit: 'impressions',
      dueDate: '2026-01-25',
      trend: 18,
    },
    {
      id: '4',
      title: 'Engagement Rate',
      category: 'engagement',
      current: 6.8,
      target: 8.0,
      unit: '%',
      dueDate: '2026-01-25',
      trend: 5,
    },
  ];

  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD') return `$${(value / 1000).toFixed(0)}K`;
    if (unit === 'impressions') return `${(value / 1000000).toFixed(1)}M`;
    if (unit === 'followers') return `${(value / 1000).toFixed(1)}K`;
    if (unit === '%') return `${value}%`;
    return value.toString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reach': return 'bg-info/10 text-info border-info/20';
      case 'engagement': return 'bg-primary/10 text-primary border-violet-500/20';
      case 'revenue': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'audience': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Growth Goals
          </CardTitle>
          <Badge variant="outline" className="text-xs">Q1 2026</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{goal.title}</span>
                  <Badge className={`text-xs capitalize ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-500 font-medium">+{goal.trend}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={Math.min(progress, 100)} className="h-2 flex-1" />
                <span className="text-xs font-medium min-w-[60px] text-right">
                  {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
