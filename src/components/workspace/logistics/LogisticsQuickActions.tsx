import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Package, 
  MapPin, 
  ClipboardList, 
  Bus,
  FileText,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface LogisticsQuickActionsProps {
  workspaceId: string;
}

export function LogisticsQuickActions(_props: LogisticsQuickActionsProps) {
  const actions = [
    {
      label: 'Track Shipment',
      icon: Truck,
      onClick: () => toast.info('Use the Shipment Tracker below to track deliveries'),
      color: 'text-blue-600',
    },
    {
      label: 'Add Equipment',
      icon: Package,
      onClick: () => toast.info('Use the Equipment Manager below to add items'),
      color: 'text-amber-600',
    },
    {
      label: 'Schedule Transport',
      icon: Bus,
      onClick: () => toast.info('Use the Transport Schedule below to add routes'),
      color: 'text-green-600',
    },
    {
      label: 'Add Venue',
      icon: MapPin,
      onClick: () => toast.info('Use Venue Logistics below to manage locations'),
      color: 'text-purple-600',
    },
    {
      label: 'Create Checklist',
      icon: ClipboardList,
      onClick: () => toast.info('Create custom checklists for logistics tasks'),
      color: 'text-indigo-600',
    },
    {
      label: 'Generate Report',
      icon: FileText,
      onClick: () => toast.success('Logistics report generated'),
      color: 'text-emerald-600',
    },
    {
      label: 'Report Issue',
      icon: AlertTriangle,
      onClick: () => toast.info('Create a high-priority task for urgent issues'),
      color: 'text-red-600',
    },
    {
      label: 'View Timeline',
      icon: Calendar,
      onClick: () => toast.info('View the milestone timeline for delivery schedule'),
      color: 'text-cyan-600',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-auto py-3 flex flex-col items-center gap-1 text-xs"
              onClick={action.onClick}
            >
              <action.icon className={`h-4 w-4 ${action.color}`} />
              <span className="text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
