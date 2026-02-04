import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Megaphone, 
  Share2, 
  Handshake, 
  MessageSquare,
  BarChart3,
  Target,
  Users
} from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function GrowthQuickActions() {
  const actions: QuickAction[] = [
    {
      label: 'Launch Campaign',
      description: 'Start a new marketing campaign',
      icon: Megaphone,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Schedule Content',
      description: 'Plan social media posts',
      icon: Share2,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Add Sponsor',
      description: 'Register a new sponsor',
      icon: Handshake,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Send Announcement',
      description: 'Broadcast to audience',
      icon: MessageSquare,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'View Analytics',
      description: 'Check growth metrics',
      icon: BarChart3,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Set Goals',
      description: 'Define growth targets',
      icon: Target,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Manage Partners',
      description: 'Track influencer partnerships',
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'PR Outreach',
      description: 'Media and press contacts',
      icon: MessageSquare,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50"
            >
              <div className={`p-1.5 rounded-lg ${action.bgColor}`}>
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <div className="text-left">
                <p className="font-medium text-xs">{action.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
