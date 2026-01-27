import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VenueSetupTrackerProps {
  workspaceId: string;
}

type SetupStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

export function VenueSetupTracker({ workspaceId }: VenueSetupTrackerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    area: '',
    requirements: '',
    assignedTo: '',
    status: 'not_started' as SetupStatus,
  });

  // Using workspace_milestones for setup tasks
  const { data: setupTasks = [], isLoading } = useQuery({
    queryKey: ['facility-setup', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data.filter(m => m.description?.startsWith('SETUP:'));
    },
  });

  const addSetupTask = useMutation({
    mutationFn: async (data: typeof formData) => {
      const description = `SETUP:${data.requirements}|${data.assignedTo}`;
      const { error } = await supabase.from('workspace_milestones').insert({
        workspace_id: workspaceId,
        title: data.area,
        description,
        status: data.status === 'completed' ? 'completed' : 'pending',
        sort_order: setupTasks.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-setup', workspaceId] });
      setFormData({ area: '', requirements: '', assignedTo: '', status: 'not_started' });
      setIsAdding(false);
      toast.success('Setup task added');
    },
    onError: () => toast.error('Failed to add task'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SetupStatus }) => {
      const dbStatus = status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : 'pending';
      const { error } = await supabase
        .from('workspace_milestones')
        .update({ status: dbStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-setup', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
      case 'not_started':
        return { label: 'Not Started', variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' };
      case 'in_progress':
        return { label: 'In Progress', variant: 'default' as const, icon: Settings, color: 'text-blue-600' };
      case 'blocked':
        return { label: 'Blocked', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' };
      case 'completed':
        return { label: 'Completed', variant: 'outline' as const, icon: CheckCircle, color: 'text-green-600' };
      default:
        return { label: status, variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading setup tasks...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Venue Setup Tracker
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Area/Room name"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <Textarea
              placeholder="Setup requirements (tables, chairs, AV, etc.)"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Assigned to"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as SetupStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addSetupTask.mutate(formData)} disabled={!formData.area}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {setupTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No setup tasks added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {setupTasks.map((task) => {
              const config = getStatusConfig(task.status);
              const parts = task.description?.replace('SETUP:', '').split('|') || [];
              const requirements = parts[0] || '';
              const assignedTo = parts[1] || '';

              return (
                <div
                  key={task.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Select
                        value={task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'not_started'}
                        onValueChange={(value) => updateStatus.mutate({ id: task.id, status: value as SetupStatus })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {requirements && (
                    <p className="text-sm text-muted-foreground">{requirements}</p>
                  )}
                  {assignedTo && (
                    <p className="text-xs text-muted-foreground mt-1">Assigned to: {assignedTo}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
