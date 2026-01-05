import { useState } from 'react';
import { useResourceRequests } from '@/hooks/useResourceRequests';
import { useWorkspaceResources } from '@/hooks/useWorkspaceResources';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ResourceRequestFormProps {
  workspaceId: string;
  parentWorkspaceId: string | null;
}

export function ResourceRequestForm({ workspaceId, parentWorkspaceId }: ResourceRequestFormProps) {
  const { user } = useAuth();
  const { createRequest, isCreating } = useResourceRequests(workspaceId);
  const { resources } = useWorkspaceResources(parentWorkspaceId ?? undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    resourceId: '',
    quantity: '1',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    purpose: '',
  });

  const availableResources = resources.filter(r => r.available > 0);
  const selectedResource = resources.find(r => r.id === formData.resourceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.resourceId || !parentWorkspaceId) return;

    createRequest({
      requesting_workspace_id: workspaceId,
      target_workspace_id: parentWorkspaceId,
      resource_id: formData.resourceId,
      requested_by: user.id,
      quantity: parseInt(formData.quantity),
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      purpose: formData.purpose || null,
    });

    setFormData({
      resourceId: '',
      quantity: '1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      purpose: '',
    });
    setIsOpen(false);
  };

  if (!parentWorkspaceId) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Request Resources
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Package className="h-4 w-4 text-primary" />
        Request Resources from Department
      </div>

      <div className="space-y-2">
        <Label>Resource</Label>
        <Select
          value={formData.resourceId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, resourceId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a resource" />
          </SelectTrigger>
          <SelectContent>
            {availableResources.length > 0 ? (
              availableResources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name} ({resource.available} available)
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No resources available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={selectedResource?.available ?? 1}
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          placeholder="Why do you need this resource?"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isCreating || !formData.resourceId}>
          <Send className="h-4 w-4 mr-2" />
          Submit Request
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
