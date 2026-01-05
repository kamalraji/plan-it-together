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
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      hoverColor: 'hover:bg-orange-500/20',
      onClick: () => toast.info('Opening menu editor...'),
    },
    {
      label: 'Check Inventory',
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      onClick: () => toast.info('Checking inventory levels...'),
    },
    {
      label: 'Export Head Count',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      onClick: () => toast.success('Head count exported'),
    },
    {
      label: 'Dietary Report',
      icon: ClipboardList,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverColor: 'hover:bg-amber-500/20',
      onClick: () => toast.info('Generating dietary report...'),
    },
    {
      label: 'Contact Vendors',
      icon: Phone,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hoverColor: 'hover:bg-green-500/20',
      onClick: () => toast.info('Opening vendor contacts...'),
    },
    {
      label: 'Cost Calculator',
      icon: Calculator,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      hoverColor: 'hover:bg-pink-500/20',
      onClick: () => toast.info('Opening cost calculator...'),
    },
    {
      label: 'Track Deliveries',
      icon: Truck,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      hoverColor: 'hover:bg-cyan-500/20',
      onClick: () => toast.info('Checking delivery status...'),
    },
    {
      label: 'Generate Report',
      icon: FileText,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      hoverColor: 'hover:bg-indigo-500/20',
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
