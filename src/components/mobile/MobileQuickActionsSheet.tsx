import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Calendar,
  CheckSquare,
  UserPlus,
  Settings,
  BarChart3,
  FileText,
  Mail,
  Users,
} from 'lucide-react';

interface MobileQuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  organization: {
    slug: string;
    name: string;
  };
}

const primaryActions = [
  { id: 'create-event', label: 'Create Event', icon: Calendar, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'create-task', label: 'Create Task', icon: CheckSquare, color: 'bg-green-500/10 text-green-600' },
  { id: 'invite-member', label: 'Invite Member', icon: UserPlus, color: 'bg-purple-500/10 text-purple-600' },
  { id: 'view-analytics', label: 'View Analytics', icon: BarChart3, color: 'bg-orange-500/10 text-orange-600' },
];

const moreActions = [
  { id: 'quick-note', label: 'Quick Note', icon: FileText },
  { id: 'quick-email', label: 'Quick Email', icon: Mail },
  { id: 'manage-team', label: 'Manage Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileQuickActionsSheet: React.FC<MobileQuickActionsSheetProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 pt-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left text-lg font-semibold">Quick Actions</SheetTitle>
        </SheetHeader>

        {/* 2x2 Primary Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* More Actions List */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
            More Actions
          </p>
          {moreActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
