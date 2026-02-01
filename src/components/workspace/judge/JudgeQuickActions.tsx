import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  UserPlus, 
  Shuffle, 
  Download, 
  Mail,
  BarChart,
  Trophy,
  Settings
} from 'lucide-react';

interface JudgeQuickActionsProps {
  workspaceId?: string;
  onViewTasks?: () => void;
}

export function JudgeQuickActions(_props: JudgeQuickActionsProps) {
  const actions = [
    {
      label: 'Invite Judge',
      icon: UserPlus,
      variant: 'default' as const,
      onClick: () => { /* TODO: Invite judge */ },
    },
    {
      label: 'Auto-Assign',
      icon: Shuffle,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Auto-assign submissions */ },
    },
    {
      label: 'Send Reminders',
      icon: Mail,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Send reminders */ },
    },
    {
      label: 'Export Scores',
      icon: Download,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Export scores */ },
    },
    {
      label: 'View Analytics',
      icon: BarChart,
      variant: 'outline' as const,
      onClick: () => { /* TODO: View analytics */ },
    },
    {
      label: 'Announce Winners',
      icon: Trophy,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Announce winners */ },
    },
    {
      label: 'Rubric Settings',
      icon: Settings,
      variant: 'ghost' as const,
      onClick: () => { /* TODO: Rubric settings */ },
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              className="justify-start gap-2 h-auto py-2.5"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
