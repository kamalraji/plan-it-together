import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalPriority } from '@/hooks/useWorkspaceApprovals';

interface ResourceRequestDialogProps {
  workspaceId: string;
  parentWorkspaceId: string;
  trigger?: React.ReactNode;
}

interface AvailableResource {
  id: string;
  name: string;
  available: number;
  type: string;
}

export function ResourceRequestDialog({
  workspaceId,
  parentWorkspaceId,
  trigger,
}: ResourceRequestDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<ApprovalPriority>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch available resources from parent workspace
  const { data: availableResources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: ['parent-workspace-resources', parentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('id, name, available, type')
        .eq('workspace_id', parentWorkspaceId)
        .gt('available', 0);

      if (error) throw error;
      return (data || []) as AvailableResource[];
    },
    enabled: open && !!parentWorkspaceId,
  });

  const selectedResource = availableResources.find(r => r.id === selectedResourceId);

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('workspace_resource_requests')
        .insert({
          requesting_workspace_id: workspaceId,
          target_workspace_id: parentWorkspaceId,
          resource_id: selectedResourceId,
          quantity: parseInt(quantity),
          purpose,
          priority,
          start_date: startDate || null,
          end_date: endDate || null,
          requested_by: user?.id!,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-resource-requests', workspaceId] });
      toast.success('Resource request submitted successfully');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setSelectedResourceId('');
    setQuantity('');
    setPurpose('');
    setPriority('medium');
    setStartDate('');
    setEndDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      toast.error('Please select a resource');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (selectedResource && parseInt(quantity) > selectedResource.available) {
      toast.error(`Only ${selectedResource.available} available`);
      return;
    }
    if (!purpose.trim()) {
      toast.error('Please provide a purpose for the request');
      return;
    }
    createRequestMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Request Resources
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Request Resources
            </DialogTitle>
            <DialogDescription>
              Submit a resource request to your parent workspace for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource</Label>
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingResources ? 'Loading...' : 'Select a resource'} />
                </SelectTrigger>
                <SelectContent>
                  {availableResources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} ({resource.available} available)
                    </SelectItem>
                  ))}
                  {availableResources.length === 0 && !isLoadingResources && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No resources available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={selectedResource?.available}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ApprovalPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Justification</Label>
              <Textarea
                id="purpose"
                placeholder="Describe why you need these resources..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
