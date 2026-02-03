import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  UserPlus,
  Download,
  Printer,
  Settings
} from 'lucide-react';

interface RegistrationQuickActionsProps {
  onScanCheckIn?: () => void;
  onAddAttendee?: () => void;
  onExportData?: () => void;
}

export function RegistrationQuickActions({ 
  onScanCheckIn, 
  onAddAttendee, 
  onExportData,
}: RegistrationQuickActionsProps) {
  const actions = [
    {
      label: 'Scan Check-in',
      icon: QrCode,
      onClick: onScanCheckIn,
      variant: 'default' as const,
    },
    {
      label: 'Add Attendee',
      icon: UserPlus,
      onClick: onAddAttendee,
      variant: 'outline' as const,
    },
    {
      label: 'Print Badges',
      icon: Printer,
      variant: 'outline' as const,
    },
    {
      label: 'Export List',
      icon: Download,
      onClick: onExportData,
      variant: 'ghost' as const,
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-3 flex-col gap-1.5 text-xs"
              onClick={action.onClick}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
