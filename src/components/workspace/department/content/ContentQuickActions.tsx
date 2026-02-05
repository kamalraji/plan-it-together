import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Gavel, 
  Plus,
  Upload,
  UserPlus,
  Calendar,
  ClipboardList,
  Star
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'create-content',
    label: 'Create Content',
    description: 'Start a new content item',
    icon: Plus,
    color: 'text-info',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    id: 'assign-judges',
    label: 'Assign Judges',
    description: 'Distribute submissions',
    icon: Gavel,
    color: 'text-warning',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
  },
  {
    id: 'enter-score',
    label: 'Enter Score',
    description: 'Score a submission',
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
  },
  {
    id: 'upload-media',
    label: 'Upload Media',
    description: 'Add photos or videos',
    icon: Upload,
    color: 'text-primary',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
  },
  {
    id: 'add-speaker',
    label: 'Add Speaker',
    description: 'Register new speaker',
    icon: UserPlus,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
  },
  {
    id: 'schedule-session',
    label: 'Schedule Session',
    description: 'Plan speaker sessions',
    icon: Calendar,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20',
  },
  {
    id: 'view-rubrics',
    label: 'View Rubrics',
    description: 'Manage scoring criteria',
    icon: ClipboardList,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
  },
];

interface ContentQuickActionsProps {
  onAction?: (actionId: string) => void;
}

export function ContentQuickActions({ onAction }: ContentQuickActionsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                onClick={() => onAction?.(action.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg ${action.bgColor} transition-colors text-center group`}
              >
                <Icon className={`h-5 w-5 ${action.color} mb-2`} />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
