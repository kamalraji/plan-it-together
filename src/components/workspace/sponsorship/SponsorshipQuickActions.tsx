import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  FilePlus, 
  UserPlus, 
  Mail, 
  FileSpreadsheet, 
  Calendar,
  Gift
} from 'lucide-react';

export function SponsorshipQuickActions() {
  const actions = [
    { label: 'New Proposal', icon: FilePlus, variant: 'default' as const },
    { label: 'Add Sponsor', icon: UserPlus, variant: 'outline' as const },
    { label: 'Send Update', icon: Mail, variant: 'outline' as const },
    { label: 'Export Report', icon: FileSpreadsheet, variant: 'outline' as const },
    { label: 'Schedule Meeting', icon: Calendar, variant: 'outline' as const },
    { label: 'Manage Benefits', icon: Gift, variant: 'outline' as const },
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
