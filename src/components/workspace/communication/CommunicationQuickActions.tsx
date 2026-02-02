import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Send, 
  Mail, 
  Megaphone, 
  FileText, 
  Calendar,
  Users
} from 'lucide-react';

export function CommunicationQuickActions() {
  const actions = [
    { label: 'Send Announcement', icon: Megaphone, variant: 'default' as const },
    { label: 'Create Email', icon: Mail, variant: 'outline' as const },
    { label: 'Draft Press Release', icon: FileText, variant: 'outline' as const },
    { label: 'Broadcast Message', icon: Send, variant: 'outline' as const },
    { label: 'Schedule Update', icon: Calendar, variant: 'outline' as const },
    { label: 'Contact Stakeholders', icon: Users, variant: 'outline' as const },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="justify-start gap-2 h-10"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
