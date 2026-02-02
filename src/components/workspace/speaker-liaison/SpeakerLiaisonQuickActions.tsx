import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  UserPlus, 
  Mail, 
  Calendar, 
  FileText,
  Plane,
  MessageSquare,
  ClipboardList
} from 'lucide-react';

interface SpeakerLiaisonQuickActionsProps {
  onAddSpeaker?: () => void;
  onSendReminder?: () => void;
  onScheduleSession?: () => void;
  onRequestMaterials?: () => void;
}

export function SpeakerLiaisonQuickActions({
  onAddSpeaker,
  onSendReminder,
  onScheduleSession,
  onRequestMaterials,
}: SpeakerLiaisonQuickActionsProps) {
  const actions = [
    {
      label: 'Add Speaker',
      description: 'Register new speaker',
      icon: UserPlus,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
      onClick: onAddSpeaker,
    },
    {
      label: 'Send Reminder',
      description: 'Email pending speakers',
      icon: Mail,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
      onClick: onSendReminder,
    },
    {
      label: 'Schedule Session',
      description: 'Assign time slots',
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      onClick: onScheduleSession,
    },
    {
      label: 'Request Materials',
      description: 'Bio, photo, slides',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
      onClick: onRequestMaterials,
    },
  ];

  const shortcuts = [
    { label: 'Book Travel', icon: Plane, color: 'text-sky-500' },
    { label: 'Send Message', icon: MessageSquare, color: 'text-pink-500' },
    { label: 'A/V Checklist', icon: ClipboardList, color: 'text-amber-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`h-auto p-3 flex flex-col items-start gap-1 ${action.bgColor} border-0`}
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="font-medium text-sm">{action.label}</span>
              <span className="text-xs text-muted-foreground text-left">
                {action.description}
              </span>
            </Button>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Shortcuts</p>
          <div className="flex gap-2">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.label}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                <shortcut.icon className={`h-3 w-3 mr-1 ${shortcut.color}`} />
                {shortcut.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
