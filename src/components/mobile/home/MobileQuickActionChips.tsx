import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanLine, 
  ListTodo, 
  Bell, 
  Users,
  CalendarPlus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void;
}

interface MobileQuickActionChipsProps {
  orgSlug: string;
  unreadCount: number;
}

export const MobileQuickActionChips: React.FC<MobileQuickActionChipsProps> = ({
  orgSlug,
  unreadCount,
}) => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'checkin',
      label: 'Check-In',
      icon: ScanLine,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      action: () => navigate(`/${orgSlug}/eventmanagement`),
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: ListTodo,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      action: () => navigate(`/${orgSlug}/workspaces`),
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      action: () => navigate(`/${orgSlug}/notifications`),
    },
    {
      id: 'team',
      label: 'Team',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      action: () => navigate(`/${orgSlug}/team`),
    },
    {
      id: 'create',
      label: 'New Event',
      icon: CalendarPlus,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      action: () => navigate(`/${orgSlug}/eventmanagement/create`),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted dark:bg-foreground/80/50',
      action: () => navigate(`/${orgSlug}/settings`),
    },
  ];

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0 snap-start",
              "border border-border bg-card hover:bg-accent/50",
              "transition-all duration-200 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
          >
            <div className={cn("p-1.5 rounded-full", action.bgColor)}>
              <action.icon className={cn("h-4 w-4", action.color)} />
            </div>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {action.label}
            </span>
            {action.id === 'notifications' && unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
