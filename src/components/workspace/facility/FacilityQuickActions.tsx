import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DoorOpen, 
  Shield, 
  Settings, 
  Wrench,
  ClipboardList,
  FileText,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface FacilityQuickActionsProps {
  workspaceId: string;
}

export function FacilityQuickActions(_props: FacilityQuickActionsProps) {
  const actions = [
    {
      label: 'Add Room',
      icon: DoorOpen,
      onClick: () => toast.info('Use the Room Manager below to add rooms'),
      color: 'text-blue-600',
    },
    {
      label: 'Safety Check',
      icon: Shield,
      onClick: () => toast.info('Use the Safety Checklist below to track inspections'),
      color: 'text-purple-600',
    },
    {
      label: 'Track Setup',
      icon: Settings,
      onClick: () => toast.info('Use the Venue Setup Tracker below'),
      color: 'text-green-600',
    },
    {
      label: 'Maintenance',
      icon: Wrench,
      onClick: () => toast.info('Use Maintenance Requests below to log issues'),
      color: 'text-amber-600',
    },
    {
      label: 'Walkthrough',
      icon: ClipboardList,
      onClick: () => toast.success('Venue walkthrough checklist started'),
      color: 'text-indigo-600',
    },
    {
      label: 'Generate Report',
      icon: FileText,
      onClick: () => toast.success('Facility report generated'),
      color: 'text-emerald-600',
    },
    {
      label: 'Report Hazard',
      icon: AlertTriangle,
      onClick: () => toast.info('Create a high-priority maintenance request for hazards'),
      color: 'text-red-600',
    },
    {
      label: 'Floor Plan',
      icon: MapPin,
      onClick: () => toast.info('Floor plan viewer coming soon'),
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
