import { useState, useMemo } from 'react';
import { useMyAssignments, MyAssignment } from '@/hooks/useMyAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  ListChecks,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  ChevronRight,
  Loader2,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, isTomorrow } from 'date-fns';

const PRIORITY_CONFIG = {
  HIGH: { label: 'High', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  LOW: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TODO: { label: 'To Do', color: 'bg-muted text-muted-foreground' },
  NOT_STARTED: { label: 'Not Started', color: 'bg-muted text-muted-foreground' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600' },
  DONE: { label: 'Done', color: 'bg-emerald-500/10 text-emerald-600' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600' },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600' },
  accepted: { label: 'Accepted', color: 'bg-blue-500/10 text-blue-600' },
};

const WORKSPACE_TYPE_COLORS: Record<string, string> = {
  ROOT: 'bg-primary/10 text-primary border-primary/20',
  DEPARTMENT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  COMMITTEE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  TEAM: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

function AssignmentCard({ assignment }: { assignment: MyAssignment }) {

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return { text: 'Today', className: 'text-amber-600 bg-amber-500/10' };
    }
    if (isTomorrow(date)) {
      return { text: 'Tomorrow', className: 'text-blue-600 bg-blue-500/10' };
    }
    if (isPast(date) && assignment.status !== 'DONE' && assignment.status !== 'completed') {
      return { text: `Overdue (${format(date, 'MMM d')})`, className: 'text-destructive bg-destructive/10' };
    }
    return { text: format(date, 'MMM d'), className: 'text-muted-foreground bg-muted' };
  };

  const dueDateInfo = getDueDateDisplay(assignment.dueDate);
  const priorityConfig = PRIORITY_CONFIG[assignment.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.MEDIUM;
  const statusConfig = STATUS_CONFIG[assignment.status] || { label: assignment.status, color: 'bg-muted text-muted-foreground' };
  const wsTypeColor = WORKSPACE_TYPE_COLORS[assignment.workspace.type || ''] || 'bg-muted text-muted-foreground';

  return (
    <div
      className="group p-4 border border-border/50 rounded-xl bg-card hover:bg-muted/30 hover:border-border transition-all cursor-pointer"
      onClick={() => {
        // TODO: Navigate to task/checklist detail
        console.log('Navigate to:', assignment);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0",
          assignment.type === 'task' ? 'bg-primary/10' : 'bg-amber-500/10'
        )}>
          {assignment.type === 'task' ? (
            <ClipboardList className="h-4 w-4 text-primary" />
          ) : (
            <ListChecks className="h-4 w-4 text-amber-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {assignment.title}
            </h4>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>

          {assignment.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", wsTypeColor)}>
              {assignment.workspace.name}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            {dueDateInfo && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", dueDateInfo.className)}>
                <Calendar className="h-2.5 w-2.5 mr-1" />
                {dueDateInfo.text}
              </Badge>
            )}
          </div>

          {assignment.progress !== undefined && assignment.progress > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={assignment.progress} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">{assignment.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MyAssignmentsDashboard() {
  const { assignments, tasks, checklists, overdue, stats, isLoading } = useMyAssignments();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredAssignments = useMemo(() => {
    let items: MyAssignment[];
    
    switch (activeTab) {
      case 'tasks':
        items = tasks;
        break;
      case 'checklists':
        items = checklists;
        break;
      case 'overdue':
        items = overdue;
        break;
      default:
        items = assignments;
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.workspace.name.toLowerCase().includes(lowerQuery) ||
        a.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return items;
  }, [activeTab, assignments, tasks, checklists, overdue, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground text-sm">
          Track all your tasks and checklists across workspaces
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assignments"
          value={stats.total}
          icon={ClipboardList}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          className={stats.overdue > 0 ? 'border-destructive/30' : ''}
        />
        <StatsCard
          title="Due Today"
          value={stats.dueToday}
          icon={Clock}
        />
        <StatsCard
          title="Completed This Week"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
        />
      </div>

      {/* Main Content */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Assignments
            </CardTitle>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="text-xs">
                All ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="checklists" className="text-xs">
                Checklists ({checklists.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs">
                Overdue ({overdue.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No assignments found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {searchQuery 
                      ? 'Try adjusting your search query'
                      : 'You don\'t have any assignments in this category yet'
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredAssignments.map((assignment) => (
                      <AssignmentCard
                        key={`${assignment.type}-${assignment.id}`}
                        assignment={assignment}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyAssignmentsDashboard;
