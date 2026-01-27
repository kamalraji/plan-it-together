import { Button } from '@/components/ui/button';
import { 
  TicketCheck, 
  Server, 
  ShieldCheck, 
  Key,
  Database,
  Settings
} from 'lucide-react';

export function ITQuickActions() {
  const actions = [
    { label: 'Create Ticket', icon: TicketCheck, variant: 'default' as const },
    { label: 'System Check', icon: Server, variant: 'outline' as const },
    { label: 'Security Scan', icon: ShieldCheck, variant: 'outline' as const },
    { label: 'Access Request', icon: Key, variant: 'outline' as const },
    { label: 'Backup Status', icon: Database, variant: 'outline' as const },
    { label: 'IT Settings', icon: Settings, variant: 'outline' as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.label} variant={action.variant} size="sm">
          <action.icon className="h-4 w-4 mr-1.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
