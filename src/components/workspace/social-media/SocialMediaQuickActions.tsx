import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  PenSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  Hash,
  Image,
  Video,
  MessageSquare
} from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function SocialMediaQuickActions() {
  const actions: QuickAction[] = [
    {
      label: 'Create Post',
      description: 'Draft a new social media post',
      icon: PenSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Schedule Content',
      description: 'Plan posts for future dates',
      icon: Calendar,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Manage Influencers',
      description: 'Track partner collaborations',
      icon: Users,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Upload Media',
      description: 'Add images and graphics',
      icon: Image,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Create Reel/Video',
      description: 'Start a new video project',
      icon: Video,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Hashtag Research',
      description: 'Find trending hashtags',
      icon: Hash,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Respond to Comments',
      description: 'Engage with audience',
      icon: MessageSquare,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
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
        <div className="grid grid-cols-2 gap-2">
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
