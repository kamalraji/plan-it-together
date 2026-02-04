import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Mail, 
  Megaphone, 
  Image, 
  BarChart3, 
  Users,
  FileText,
  Send
} from 'lucide-react';

export function MarketingQuickActions() {
  const actions = [
    {
      label: 'Create Campaign',
      icon: Megaphone,
      variant: 'default' as const,
      color: 'bg-pink-600 hover:bg-pink-700',
    },
    {
      label: 'Send Newsletter',
      icon: Mail,
      variant: 'outline' as const,
    },
    {
      label: 'Schedule Post',
      icon: Send,
      variant: 'outline' as const,
    },
    {
      label: 'Upload Asset',
      icon: Image,
      variant: 'outline' as const,
    },
    {
      label: 'View Analytics',
      icon: BarChart3,
      variant: 'outline' as const,
    },
    {
      label: 'Audience Report',
      icon: Users,
      variant: 'outline' as const,
    },
    {
      label: 'Draft Content',
      icon: FileText,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className={`w-full justify-start gap-2 ${action.color || ''}`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
