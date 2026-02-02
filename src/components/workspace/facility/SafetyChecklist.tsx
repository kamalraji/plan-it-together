import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Shield, Plus, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SafetyChecklistProps {
  workspaceId: string;
}

const DEFAULT_SAFETY_ITEMS = [
  'Fire extinguishers inspected and accessible',
  'Emergency exits clearly marked and unobstructed',
  'First aid kits fully stocked and accessible',
  'Emergency evacuation plan posted',
  'Fire alarm system tested',
  'Emergency lighting functional',
  'AED device checked and accessible',
  'Security personnel briefed',
  'Emergency contact numbers posted',
  'Crowd control barriers in place',
];

export function SafetyChecklist({ workspaceId }: SafetyChecklistProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');

  const { data: safetyTasks = [], isLoading } = useQuery({
    queryKey: ['facility-safety', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('role_scope', 'safety')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const initializeDefaults = useMutation({
    mutationFn: async () => {
      const tasks = DEFAULT_SAFETY_ITEMS.map(item => ({
        workspace_id: workspaceId,
        title: item,
        status: 'TODO',
        priority: 'high',
        role_scope: 'safety',
      }));
      const { error } = await supabase.from('workspace_tasks').insert(tasks);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety', workspaceId] });
      toast.success('Safety checklist initialized');
    },
    onError: () => toast.error('Failed to initialize checklist'),
  });

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from('workspace_tasks').insert({
        workspace_id: workspaceId,
        title,
        status: 'TODO',
        priority: 'high',
        role_scope: 'safety',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety', workspaceId] });
      setNewItem('');
      setIsAdding(false);
      toast.success('Safety item added');
    },
    onError: () => toast.error('Failed to add item'),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status: completed ? 'DONE' : 'TODO' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-safety', workspaceId] });
    },
  });

  const completedCount = safetyTasks.filter(t => t.status === 'DONE').length;
  const totalCount = safetyTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading safety checklist...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Safety Checklist
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount}/{totalCount} completed ({completionPercent}%)
          </p>
        </div>
        <div className="flex gap-2">
          {safetyTasks.length === 0 && (
            <Button size="sm" variant="outline" onClick={() => initializeDefaults.mutate()}>
              Load Defaults
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {isAdding && (
          <div className="flex gap-2">
            <Input
              placeholder="New safety check item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newItem && addItem.mutate(newItem)}
            />
            <Button size="sm" onClick={() => addItem.mutate(newItem)} disabled={!newItem}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        {safetyTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No safety items added yet</p>
            <p className="text-sm">Click "Load Defaults" to start with common items</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {safetyTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors ${
                  task.status === 'DONE' ? 'opacity-60' : ''
                }`}
              >
                <Checkbox
                  checked={task.status === 'DONE'}
                  onCheckedChange={(checked) =>
                    toggleItem.mutate({ id: task.id, completed: checked as boolean })
                  }
                />
                <span className={task.status === 'DONE' ? 'line-through' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
