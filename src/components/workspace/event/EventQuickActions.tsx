import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Calendar,
  Users,
  Megaphone,
  FileText,
  AlertCircle,
  Send,
} from 'lucide-react';

interface EventQuickActionsProps {
  workspaceId?: string;
}

export function EventQuickActions(_props: EventQuickActionsProps) {
  const actions = [
    { label: 'Update Schedule', icon: Calendar, variant: 'default' as const },
    { label: 'Brief All Teams', icon: Megaphone, variant: 'outline' as const },
    { label: 'VIP Check-in', icon: Users, variant: 'outline' as const },
    { label: 'Send Reminder', icon: Send, variant: 'outline' as const },
    { label: 'Log Issue', icon: AlertCircle, variant: 'outline' as const },
    { label: 'Export Run Sheet', icon: FileText, variant: 'outline' as const },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              className="h-auto py-3 flex-col gap-1 justify-center"
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
