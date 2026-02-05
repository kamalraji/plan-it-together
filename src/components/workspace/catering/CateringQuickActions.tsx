import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Utensils, 
  ClipboardList, 
  Package, 
  Users, 
  FileText, 
  Phone,
  Calculator,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';

interface CateringQuickActionsProps {
  workspaceId: string;
}

export function CateringQuickActions({ workspaceId: _workspaceId }: CateringQuickActionsProps) {
  const quickActions = [
    {
      label: 'Update Menu',
      icon: Utensils,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      hoverColor: 'hover:bg-warning/20',
      onClick: () => toast.info('Opening menu editor...'),
    },
    {
      label: 'Check Inventory',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      hoverColor: 'hover:bg-primary/20',
      onClick: () => toast.info('Checking inventory levels...'),
    },
    {
      label: 'Export Head Count',
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
      hoverColor: 'hover:bg-info/20',
      onClick: () => toast.success('Head count exported'),
    },
    {
      label: 'Dietary Report',
      icon: ClipboardList,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      hoverColor: 'hover:bg-warning/20',
      onClick: () => toast.info('Generating dietary report...'),
    },
    {
      label: 'Contact Vendors',
      icon: Phone,
      color: 'text-success',
      bgColor: 'bg-success/10',
      hoverColor: 'hover:bg-success/20',
      onClick: () => toast.info('Opening vendor contacts...'),
    },
    {
      label: 'Cost Calculator',
      icon: Calculator,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      hoverColor: 'hover:bg-accent/20',
      onClick: () => toast.info('Opening cost calculator...'),
    },
    {
      label: 'Track Deliveries',
      icon: Truck,
      color: 'text-info',
      bgColor: 'bg-info/10',
      hoverColor: 'hover:bg-info/20',
      onClick: () => toast.info('Checking delivery status...'),
    },
    {
      label: 'Generate Report',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      hoverColor: 'hover:bg-primary/20',
      onClick: () => toast.success('Report generated'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="ghost"
                className={`h-auto py-3 px-3 justify-start ${action.bgColor} ${action.hoverColor} border border-transparent hover:border-border/50`}
                onClick={action.onClick}
              >
                <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
