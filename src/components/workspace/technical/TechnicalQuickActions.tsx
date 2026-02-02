import { Button } from '@/components/ui/button';
import { 
  Headphones, 
  Monitor, 
  Wifi, 
  ClipboardList, 
  AlertTriangle,
  Settings
} from 'lucide-react';

export function TechnicalQuickActions() {
  const actions = [
    { label: 'Create Ticket', icon: Headphones, variant: 'default' as const },
    { label: 'Add Equipment', icon: Monitor, variant: 'outline' as const },
    { label: 'Network Check', icon: Wifi, variant: 'outline' as const },
    { label: 'Run Checklist', icon: ClipboardList, variant: 'outline' as const },
    { label: 'Report Issue', icon: AlertTriangle, variant: 'outline' as const },
    { label: 'AV Settings', icon: Settings, variant: 'outline' as const },
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
