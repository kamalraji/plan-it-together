import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MaintenanceRequestsProps {
  workspaceId: string;
}

type Priority = 'low' | 'medium' | 'high';
type Status = 'open' | 'in_progress' | 'resolved';

export function MaintenanceRequests({ workspaceId }: MaintenanceRequestsProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    priority: 'medium' as Priority,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['facility-maintenance', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('role_scope', 'maintenance')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addRequest = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('workspace_tasks').insert({
        workspace_id: workspaceId,
        title: data.title,
        description: `${data.location}|${data.description}`,
        status: 'TODO',
        priority: data.priority,
        role_scope: 'maintenance',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-maintenance', workspaceId] });
      setFormData({ title: '', location: '', description: '', priority: 'medium' });
      setIsAdding(false);
      toast.success('Maintenance request created');
    },
    onError: () => toast.error('Failed to create request'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const dbStatus = status === 'resolved' ? 'DONE' : status === 'in_progress' ? 'IN_PROGRESS' : 'TODO';
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status: dbStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-maintenance', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TODO':
        return { label: 'Open', variant: 'secondary' as const, icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'In Progress', variant: 'default' as const, icon: Wrench };
      case 'DONE':
        return { label: 'Resolved', variant: 'outline' as const, icon: CheckCircle };
      default:
        return { label: status, variant: 'secondary' as const, icon: Clock };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'High', color: 'bg-red-500/10 text-red-600' };
      case 'medium':
        return { label: 'Medium', color: 'bg-amber-500/10 text-amber-600' };
      case 'low':
        return { label: 'Low', color: 'bg-green-500/10 text-green-600' };
      default:
        return { label: priority, color: 'bg-muted text-muted-foreground' };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading requests...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Maintenance Requests
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          New Request
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Issue title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Describe the issue"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addRequest.mutate(formData)} disabled={!formData.title}>
                Submit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No maintenance requests</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {requests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const priorityConfig = getPriorityConfig(request.priority);
              const parts = request.description?.split('|') || [];
              const location = parts[0] || '';
              const description = parts[1] || '';

              return (
                <div
                  key={request.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{request.title}</p>
                      <Badge variant="outline" className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig.variant}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Select
                        value={request.status === 'DONE' ? 'resolved' : request.status === 'IN_PROGRESS' ? 'in_progress' : 'open'}
                        onValueChange={(value) => updateStatus.mutate({ id: request.id, status: value as Status })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {location && <p>Location: {location}</p>}
                    {description && <p className="mt-1">{description}</p>}
                    <p className="text-xs mt-1">
                      Created: {format(new Date(request.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
