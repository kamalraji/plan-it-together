import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Megaphone, 
  FileBarChart,
  ClipboardCheck,
  GraduationCap,
  Award,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export function VolunteersDeptQuickActions() {
  const actions = [
    {
      label: 'View Committees',
      description: 'All volunteer teams',
      icon: Users,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      hoverColor: 'hover:bg-rose-500/20',
    },
    {
      label: 'Shift Overview',
      description: 'All scheduled shifts',
      icon: Calendar,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      hoverColor: 'hover:bg-pink-500/20',
    },
    {
      label: 'Mass Announcement',
      description: 'Message all volunteers',
      icon: Megaphone,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
    },
    {
      label: 'Hours Report',
      description: 'Generate hours log',
      icon: FileBarChart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
    },
    {
      label: 'Approve Timesheets',
      description: 'Review hours logged',
      icon: ClipboardCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      hoverColor: 'hover:bg-emerald-500/20',
    },
    {
      label: 'Training Schedule',
      description: 'Volunteer training',
      icon: GraduationCap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverColor: 'hover:bg-amber-500/20',
    },
    {
      label: 'Recognition',
      description: 'Award top volunteers',
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      hoverColor: 'hover:bg-yellow-500/20',
    },
    {
      label: 'Recruitment',
      description: 'Invite new volunteers',
      icon: Mail,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      hoverColor: 'hover:bg-indigo-500/20',
    },
  ];

  const handleAction = (label: string) => {
    toast.info(`${label} action coming soon`);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Volunteer Management Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`flex flex-col h-auto py-3 px-2 ${action.bgColor} ${action.hoverColor} border-0`}
              onClick={() => handleAction(action.label)}
            >
              <action.icon className={`h-5 w-5 mb-1.5 ${action.color}`} />
              <span className="text-xs font-medium text-foreground">{action.label}</span>
              <span className="text-[10px] text-muted-foreground">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
