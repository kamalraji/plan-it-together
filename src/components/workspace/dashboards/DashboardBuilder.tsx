import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Move,
  Save,
  LayoutGrid,
  BarChart3,
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

export type WidgetType =
  | 'task-count'
  | 'task-progress'
  | 'team-members'
  | 'chart'
  | 'timeline'
  | 'recent-activity'
  | 'calendar-mini'
  | 'messages';

interface DashboardBuilderProps {
  workspaceId: string;
  initialWidgets?: Widget[];
  onSave?: (widgets: Widget[]) => void;
}

const WIDGET_TYPES: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: 'task-count', label: 'Task Counter', icon: <CheckSquare className="h-4 w-4" /> },
  { type: 'task-progress', label: 'Task Progress', icon: <TrendingUp className="h-4 w-4" /> },
  { type: 'team-members', label: 'Team Members', icon: <Users className="h-4 w-4" /> },
  { type: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { type: 'timeline', label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
  { type: 'recent-activity', label: 'Recent Activity', icon: <LayoutGrid className="h-4 w-4" /> },
  { type: 'calendar-mini', label: 'Mini Calendar', icon: <Calendar className="h-4 w-4" /> },
  { type: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function DashboardBuilder({
  workspaceId: _workspaceId,
  initialWidgets = [],
  onSave,
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>('task-count');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const addWidget = useCallback(() => {
    if (!newWidgetTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a widget title',
        variant: 'destructive',
      });
      return;
    }

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: newWidgetType,
      title: newWidgetTitle,
      position: {
        x: 0,
        y: widgets.length,
        w: 1,
        h: 1,
      },
      config: {},
    };

    setWidgets(prev => [...prev, newWidget]);
    setIsAddingWidget(false);
    setNewWidgetTitle('');
    setIsDirty(true);
    
    toast({
      title: 'Widget Added',
      description: `${newWidgetTitle} has been added to your dashboard`,
    });
  }, [newWidgetType, newWidgetTitle, widgets.length]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setIsDirty(true);
  }, []);

  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === widgetId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newWidgets = [...prev];
      [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      return newWidgets;
    });
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(widgets);
    setIsDirty(false);
    toast({
      title: 'Dashboard Saved',
      description: 'Your dashboard layout has been saved',
    });
  }, [widgets, onSave]);

  const getWidgetIcon = (type: WidgetType) => {
    return WIDGET_TYPES.find(w => w.type === type)?.icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Builder</h2>
          <p className="text-muted-foreground">
            Customize your workspace dashboard with widgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddingWidget} onOpenChange={setIsAddingWidget}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget type and customize it
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Widget Type</Label>
                  <Select value={newWidgetType} onValueChange={(v) => setNewWidgetType(v as WidgetType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WIDGET_TYPES.map((wt) => (
                        <SelectItem key={wt.type} value={wt.type}>
                          <div className="flex items-center gap-2">
                            {wt.icon}
                            <span>{wt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Widget Title</Label>
                  <Input
                    placeholder="Enter widget title..."
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingWidget(false)}>
                  Cancel
                </Button>
                <Button onClick={addWidget}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Widgets Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your custom dashboard by adding widgets
              </p>
              <Button onClick={() => setIsAddingWidget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget, index) => (
            <Card key={widget.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getWidgetIcon(widget.type)}
                    <CardTitle className="text-base">{widget.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={index === 0}
                    >
                      <Move className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={index === widgets.length - 1}
                    >
                      <Move className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeWidget(widget.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {WIDGET_TYPES.find(w => w.type === widget.type)?.label}
                </Badge>
              </CardHeader>
              <CardContent>
                <WidgetPreview type={widget.type} config={widget.config} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetPreview({ type, config: _config }: { type: WidgetType; config: Record<string, any> }) {
  // Placeholder previews for different widget types
  const previews: Record<WidgetType, React.ReactNode> = {
    'task-count': (
      <div className="h-20 flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">24</div>
          <div className="text-xs text-muted-foreground">Total Tasks</div>
        </div>
      </div>
    ),
    'task-progress': (
      <div className="h-20 flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-success">75%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>
    ),
    'team-members': (
      <div className="h-20 flex items-center justify-center gap-1 bg-muted/30 rounded-lg">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-8 h-8 rounded-full bg-primary/20" />
        ))}
        <span className="text-sm text-muted-foreground ml-2">+5</span>
      </div>
    ),
    'chart': (
      <div className="h-20 flex items-end justify-center gap-1 bg-muted/30 rounded-lg p-3">
        {[40, 60, 30, 80, 50, 70].map((h, i) => (
          <div key={i} className="w-4 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
    'timeline': (
      <div className="h-20 flex items-center bg-muted/30 rounded-lg p-3">
        <div className="flex-1 h-2 bg-gradient-to-r from-primary via-primary/50 to-muted rounded-full" />
      </div>
    ),
    'recent-activity': (
      <div className="h-20 flex flex-col justify-center gap-1 bg-muted/30 rounded-lg p-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="h-2 flex-1 bg-muted rounded" />
          </div>
        ))}
      </div>
    ),
    'calendar-mini': (
      <div className="h-20 grid grid-cols-7 gap-0.5 bg-muted/30 rounded-lg p-2">
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className={`aspect-square rounded text-[8px] flex items-center justify-center ${i === 15 ? 'bg-primary text-primary-foreground' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>
    ),
    'messages': (
      <div className="h-20 flex flex-col justify-center gap-1 bg-muted/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20" />
          <div className="flex-1">
            <div className="h-2 w-16 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded mt-1" />
          </div>
        </div>
      </div>
    ),
  };

  return previews[type] || <div className="h-20 bg-muted/30 rounded-lg" />;
}
