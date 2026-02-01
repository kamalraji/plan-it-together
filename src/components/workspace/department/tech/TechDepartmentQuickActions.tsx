import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Wifi, 
  Shield, 
  Monitor, 
  HardDrive,
  AlertTriangle,
  Settings,
  FileText
} from 'lucide-react';

interface TechDepartmentQuickActionsProps {
  onAction?: (action: string) => void;
}

export function TechDepartmentQuickActions({ onAction }: TechDepartmentQuickActionsProps) {
  const actions = [
    { id: 'system-check', label: 'System Health Check', icon: Server, variant: 'default' as const },
    { id: 'network-status', label: 'Network Status', icon: Wifi, variant: 'outline' as const },
    { id: 'security-audit', label: 'Security Audit', icon: Shield, variant: 'outline' as const },
    { id: 'equipment-report', label: 'Equipment Report', icon: Monitor, variant: 'outline' as const },
    { id: 'backup-status', label: 'Backup Status', icon: HardDrive, variant: 'outline' as const },
    { id: 'incident-report', label: 'Report Incident', icon: AlertTriangle, variant: 'outline' as const },
    { id: 'config-review', label: 'Config Review', icon: Settings, variant: 'outline' as const },
    { id: 'documentation', label: 'Documentation', icon: FileText, variant: 'outline' as const },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Tech Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="sm"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => onAction?.(action.id)}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
