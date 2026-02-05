import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  AlertTriangle, Clock, Plus, Trash2, Settings, Bell,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

interface EscalationRule {
  id: string;
  workspaceId: string;
  itemType: 'TASK' | 'BUDGET_REQUEST' | 'RESOURCE_REQUEST';
  triggerAfterHours: number;
  slaHours: number | null;
  escalateTo: 'PARENT' | 'DEPARTMENT' | 'ROOT';
  escalationPath: string[] | null;
  notifyRoles: string[];
  notificationChannels: string[];
  isActive: boolean;
  autoReassign: boolean;
  createdBy: string | null;
  createdAt: string;
}

interface EscalationRulesManagerProps {
  workspaceId: string;
}

export function EscalationRulesManager({ workspaceId }: EscalationRulesManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  
  // Form state for new rule
  const [newRule, setNewRule] = useState({
    itemType: 'TASK' as const,
    triggerAfterHours: 24,
    slaHours: 48,
    escalateTo: 'PARENT' as const,
    notifyRoles: ['MANAGER', 'LEAD'],
    autoReassign: false,
  });

  // Fetch escalation rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['escalation-rules', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('item_type', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        itemType: row.item_type,
        triggerAfterHours: row.trigger_after_hours,
        slaHours: row.sla_hours,
        escalateTo: row.escalate_to,
        escalationPath: row.escalation_path,
        notifyRoles: row.notify_roles || [],
        notificationChannels: row.notification_channels || [],
        isActive: row.is_active,
        autoReassign: row.auto_reassign,
        createdBy: row.created_by,
        createdAt: row.created_at,
      })) as EscalationRule[];
    },
  });

  // Create rule mutation
  const createMutation = useMutation({
    mutationFn: async (rule: typeof newRule) => {
      const { error } = await supabase
        .from('escalation_rules')
        .insert({
          workspace_id: workspaceId,
          item_type: rule.itemType,
          trigger_after_hours: rule.triggerAfterHours,
          sla_hours: rule.slaHours,
          escalate_to: rule.escalateTo,
          notify_roles: rule.notifyRoles,
          auto_reassign: rule.autoReassign,
          is_active: true,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation-rules', workspaceId] });
      setCreateDialogOpen(false);
      setNewRule({
        itemType: 'TASK',
        triggerAfterHours: 24,
        slaHours: 48,
        escalateTo: 'PARENT',
        notifyRoles: ['MANAGER', 'LEAD'],
        autoReassign: false,
      });
      toast.success('Escalation rule created');
    },
    onError: () => {
      toast.error('Failed to create rule');
    },
  });

  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('escalation_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation-rules', workspaceId] });
    },
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escalation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation-rules', workspaceId] });
      setRuleToDelete(null);
      toast.success('Rule deleted');
    },
  });

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'TASK': return 'Task';
      case 'BUDGET_REQUEST': return 'Budget Request';
      case 'RESOURCE_REQUEST': return 'Resource Request';
      default: return type;
    }
  };

  const getEscalateToLabel = (level: string) => {
    switch (level) {
      case 'PARENT': return 'Parent Workspace';
      case 'DEPARTMENT': return 'Department';
      case 'ROOT': return 'Event Root';
      default: return level;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Escalation Rules</CardTitle>
              <CardDescription>
                Configure automatic escalation for overdue items
              </CardDescription>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Escalation Rule</DialogTitle>
                <DialogDescription>
                  Define when and how items should be escalated.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select
                    value={newRule.itemType}
                    onValueChange={(value: any) => setNewRule({ ...newRule, itemType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="BUDGET_REQUEST">Budget Request</SelectItem>
                      <SelectItem value="RESOURCE_REQUEST">Resource Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger After (hours)</Label>
                    <Input
                      type="number"
                      value={newRule.triggerAfterHours}
                      onChange={(e) => setNewRule({ ...newRule, triggerAfterHours: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SLA (hours)</Label>
                    <Input
                      type="number"
                      value={newRule.slaHours}
                      onChange={(e) => setNewRule({ ...newRule, slaHours: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Escalate To</Label>
                  <Select
                    value={newRule.escalateTo}
                    onValueChange={(value: any) => setNewRule({ ...newRule, escalateTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARENT">Parent Workspace</SelectItem>
                      <SelectItem value="DEPARTMENT">Department</SelectItem>
                      <SelectItem value="ROOT">Event Root</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Reassign</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically reassign to escalation target
                    </p>
                  </div>
                  <Switch
                    checked={newRule.autoReassign}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, autoReassign: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createMutation.mutate(newRule)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No escalation rules configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add rules to automatically escalate overdue items
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  rule.isActive ? 'bg-card' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getItemTypeLabel(rule.itemType)}</span>
                      <Badge variant="outline" className="text-xs">
                        {rule.triggerAfterHours}h trigger
                      </Badge>
                      {rule.slaHours && (
                        <Badge variant="secondary" className="text-xs">
                          {rule.slaHours}h SLA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>{getEscalateToLabel(rule.escalateTo)}</span>
                      {rule.autoReassign && (
                        <>
                          <span>•</span>
                          <span>Auto-reassign</span>
                        </>
                      )}
                      {rule.notifyRoles.length > 0 && (
                        <>
                          <span>•</span>
                          <Bell className="h-3 w-3" />
                          <span>{rule.notifyRoles.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRuleToDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmationDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Delete escalation rule"
        description="This will permanently delete this escalation rule. Active escalations will continue but no new ones will be triggered."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (ruleToDelete) deleteMutation.mutate(ruleToDelete); }}
      />
    </Card>
  );
}
