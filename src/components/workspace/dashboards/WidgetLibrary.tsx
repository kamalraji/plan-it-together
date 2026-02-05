import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckSquare,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  LayoutGrid,
  Calendar,
  MessageSquare,
  Plus,
  Star,
} from 'lucide-react';
import { WidgetType } from './DashboardBuilder';

interface WidgetLibraryProps {
  onAddWidget: (type: WidgetType, title: string) => void;
}

interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'tasks' | 'team' | 'analytics' | 'communication';
  isPopular?: boolean;
}

const WIDGET_LIBRARY: WidgetDefinition[] = [
  {
    type: 'task-count',
    title: 'Task Counter',
    description: 'Display total, completed, and pending tasks',
    icon: <CheckSquare className="h-5 w-5" />,
    category: 'tasks',
    isPopular: true,
  },
  {
    type: 'task-progress',
    title: 'Task Progress',
    description: 'Show overall task completion percentage',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'tasks',
    isPopular: true,
  },
  {
    type: 'team-members',
    title: 'Team Members',
    description: 'Display team member avatars and count',
    icon: <Users className="h-5 w-5" />,
    category: 'team',
    isPopular: true,
  },
  {
    type: 'chart',
    title: 'Analytics Chart',
    description: 'Visualize data with bar, line, or pie charts',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'analytics',
  },
  {
    type: 'timeline',
    title: 'Timeline',
    description: 'Show project timeline and milestones',
    icon: <Clock className="h-5 w-5" />,
    category: 'analytics',
  },
  {
    type: 'recent-activity',
    title: 'Recent Activity',
    description: 'Display latest workspace activities',
    icon: <LayoutGrid className="h-5 w-5" />,
    category: 'team',
  },
  {
    type: 'calendar-mini',
    title: 'Mini Calendar',
    description: 'Compact calendar with deadline highlights',
    icon: <Calendar className="h-5 w-5" />,
    category: 'tasks',
  },
  {
    type: 'messages',
    title: 'Recent Messages',
    description: 'Show latest channel messages',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'communication',
  },
];

// Categories available for filtering (not currently used, kept for future use)
// const CATEGORIES = [
//   { id: 'all', label: 'All Widgets' },
//   { id: 'tasks', label: 'Tasks' },
//   { id: 'team', label: 'Team' },
//   { id: 'analytics', label: 'Analytics' },
//   { id: 'communication', label: 'Communication' },
// ] as const;

export function WidgetLibrary({ onAddWidget }: WidgetLibraryProps) {
  const popularWidgets = WIDGET_LIBRARY.filter(w => w.isPopular);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Widget Library
        </CardTitle>
        <CardDescription>
          Choose from available widgets to customize your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Popular Widgets */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" />
            Popular Widgets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {popularWidgets.map((widget) => (
              <WidgetCard
                key={widget.type}
                widget={widget}
                onAdd={() => onAddWidget(widget.type, widget.title)}
              />
            ))}
          </div>
        </div>

        {/* All Widgets */}
        <div>
          <h3 className="text-sm font-medium mb-3">All Widgets</h3>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
              {WIDGET_LIBRARY.map((widget) => (
                <WidgetCard
                  key={widget.type}
                  widget={widget}
                  onAdd={() => onAddWidget(widget.type, widget.title)}
                  showCategory
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetCard({
  widget,
  onAdd,
  showCategory = false,
}: {
  widget: WidgetDefinition;
  onAdd: () => void;
  showCategory?: boolean;
}) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tasks':
        return 'bg-info/10 text-info dark:bg-info/20 dark:text-info';
      case 'team':
        return 'bg-success/10 text-success dark:bg-success/20 dark:text-success';
      case 'analytics':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'communication':
        return 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
      <div className="p-2 rounded-md bg-primary/10 text-primary">
        {widget.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{widget.title}</h4>
          {widget.isPopular && (
            <Star className="h-3 w-3 text-warning fill-yellow-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {widget.description}
        </p>
        {showCategory && (
          <Badge
            variant="secondary"
            className={`mt-1.5 text-[10px] px-1.5 py-0 ${getCategoryColor(widget.category)}`}
          >
            {widget.category}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
