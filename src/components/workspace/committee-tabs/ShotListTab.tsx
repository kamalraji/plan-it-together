import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
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
  Camera, 
  Video,
  Plus,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  ListChecks
} from 'lucide-react';
import { toast } from 'sonner';

interface ShotItem {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  shot_type: 'photo' | 'video' | 'both';
  location: string | null;
  scheduled_time: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
}

interface ShotListTabProps {
  workspaceId: string;
  onBack?: () => void;
}

// Hook to fetch shot list items from media_assets metadata
function useShotList(workspaceId: string) {
  return useQuery({
    queryKey: ['shot-list', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'shot_list')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform media assets to shot items
      return (data || []).map(asset => {
        const metadata = asset.metadata as Record<string, unknown> || {};
        return {
          id: asset.id,
          workspace_id: asset.workspace_id,
          title: asset.name,
          description: asset.description,
          shot_type: (metadata.shot_type as 'photo' | 'video' | 'both') || 'photo',
          location: metadata.location as string | null,
          scheduled_time: metadata.scheduled_time as string | null,
          priority: (metadata.priority as 'low' | 'medium' | 'high') || 'medium',
          status: (metadata.shot_status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending',
          assigned_to: metadata.assigned_to as string | null,
          notes: metadata.notes as string | null,
          created_at: asset.created_at,
        } as ShotItem;
      });
    },
    enabled: !!workspaceId,
  });
}

function useCreateShot(workspaceId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shot: Omit<ShotItem, 'id' | 'workspace_id' | 'created_at'>) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .insert([{
          workspace_id: workspaceId,
          name: shot.title,
          description: shot.description,
          type: shot.shot_type === 'video' ? 'video' : 'photo',
          status: 'shot_list',
          metadata: {
            shot_type: shot.shot_type,
            location: shot.location,
            scheduled_time: shot.scheduled_time,
            priority: shot.priority,
            shot_status: shot.status,
            assigned_to: shot.assigned_to,
            notes: shot.notes,
          },
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-list', workspaceId] });
      toast.success('Shot added to list');
    },
    onError: (error) => {
      toast.error('Failed to add shot: ' + error.message);
    },
  });
}

function useUpdateShot(workspaceId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ShotItem> }) => {
      const metadata: Record<string, unknown> = {};
      if (updates.shot_type) metadata.shot_type = updates.shot_type;
      if (updates.location !== undefined) metadata.location = updates.location;
      if (updates.scheduled_time !== undefined) metadata.scheduled_time = updates.scheduled_time;
      if (updates.priority) metadata.priority = updates.priority;
      if (updates.status) metadata.shot_status = updates.status;
      if (updates.assigned_to !== undefined) metadata.assigned_to = updates.assigned_to;
      if (updates.notes !== undefined) metadata.notes = updates.notes;

      const { error } = await supabase
        .from('workspace_media_assets')
        .update({
          name: updates.title,
          description: updates.description,
          metadata: JSON.parse(JSON.stringify(metadata)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-list', workspaceId] });
      toast.success('Shot updated');
    },
    onError: (error) => {
      toast.error('Failed to update shot: ' + error.message);
    },
  });
}

function useDeleteShot(workspaceId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-list', workspaceId] });
      toast.success('Shot removed');
    },
    onError: (error) => {
      toast.error('Failed to remove shot: ' + error.message);
    },
  });
}

const priorityConfig = {
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusConfig = {
  pending: { icon: Circle, color: 'text-muted-foreground', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-amber-500', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
  cancelled: { icon: Trash2, color: 'text-red-500', label: 'Cancelled' },
};

export function ShotListTab({ workspaceId, onBack }: ShotListTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [newShot, setNewShot] = useState({
    title: '',
    description: '',
    shot_type: 'photo' as 'photo' | 'video' | 'both',
    location: '',
    scheduled_time: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assigned_to: '',
    notes: '',
  });

  const { data: shots = [], isLoading } = useShotList(workspaceId);
  const createShot = useCreateShot(workspaceId);
  const updateShot = useUpdateShot(workspaceId);
  const deleteShot = useDeleteShot(workspaceId);

  const filteredShots = filterStatus 
    ? shots.filter(s => s.status === filterStatus)
    : shots;

  const handleSubmit = () => {
    if (!newShot.title.trim()) {
      toast.error('Please enter a shot title');
      return;
    }
    createShot.mutate(newShot, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewShot({
          title: '',
          description: '',
          shot_type: 'photo',
          location: '',
          scheduled_time: '',
          priority: 'medium',
          status: 'pending',
          assigned_to: '',
          notes: '',
        });
      },
    });
  };

  const toggleShotStatus = (shot: ShotItem) => {
    const nextStatus: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
      cancelled: 'pending',
    };
    updateShot.mutate({ id: shot.id, updates: { status: nextStatus[shot.status] } });
  };

  const stats = {
    total: shots.length,
    pending: shots.filter(s => s.status === 'pending').length,
    inProgress: shots.filter(s => s.status === 'in_progress').length,
    completed: shots.filter(s => s.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-fuchsia-500" />
              Shot List
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage photography and video shot requirements
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Shot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newShot.title}
                  onChange={(e) => setNewShot({ ...newShot, title: e.target.value })}
                  placeholder="e.g., Opening ceremony wide shot"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newShot.description}
                  onChange={(e) => setNewShot({ ...newShot, description: e.target.value })}
                  placeholder="Describe what this shot should capture..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newShot.shot_type}
                    onValueChange={(v) => setNewShot({ ...newShot, shot_type: v as 'photo' | 'video' | 'both' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newShot.priority}
                    onValueChange={(v) => setNewShot({ ...newShot, priority: v as 'low' | 'medium' | 'high' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newShot.location}
                  onChange={(e) => setNewShot({ ...newShot, location: e.target.value })}
                  placeholder="e.g., Main Stage"
                />
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={newShot.scheduled_time}
                  onChange={(e) => setNewShot({ ...newShot, scheduled_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newShot.notes}
                  onChange={(e) => setNewShot({ ...newShot, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createShot.isPending}>
                {createShot.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Shot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus(null)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Shots</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ListChecks className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Circle className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus('in_progress')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus('completed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shot List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {filterStatus ? `${statusConfig[filterStatus as keyof typeof statusConfig]?.label} Shots` : 'All Shots'}
          </CardTitle>
          {filterStatus && (
            <Button variant="ghost" size="sm" onClick={() => setFilterStatus(null)}>
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredShots.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No shots found</h3>
                  <p className="text-sm text-muted-foreground">
                    {filterStatus ? 'Try clearing the filter' : 'Add your first shot to get started'}
                  </p>
                </div>
              ) : (
                filteredShots.map((shot) => {
                  const StatusIcon = statusConfig[shot.status].icon;
                  return (
                    <div
                      key={shot.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={shot.status === 'completed'}
                        onCheckedChange={() => toggleShotStatus(shot)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-medium ${shot.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {shot.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {shot.shot_type === 'photo' ? <Camera className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                            {shot.shot_type}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${priorityConfig[shot.priority]}`}>
                            {shot.priority}
                          </Badge>
                        </div>
                        {shot.description && (
                          <p className="text-sm text-muted-foreground mt-1">{shot.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {shot.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shot.location}
                            </div>
                          )}
                          {shot.scheduled_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(shot.scheduled_time).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${statusConfig[shot.status].color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[shot.status].label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteShot.mutate(shot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
