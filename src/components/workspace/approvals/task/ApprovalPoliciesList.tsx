import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { TaskApprovalPolicy } from '@/lib/taskApprovalTypes';
import { useTaskApprovalPolicies } from '@/hooks/useTaskApprovalPolicies';
import { ApprovalPolicyBuilder } from './ApprovalPolicyBuilder';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import { getApprovalLevelDisplay } from '@/hooks/useTaskApprovalCheck';
import { Skeleton } from '@/components/ui/skeleton';

interface ApprovalPoliciesListProps {
  workspaceId: string;
}

export function ApprovalPoliciesList({ workspaceId }: ApprovalPoliciesListProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<TaskApprovalPolicy | null>(null);

  const { 
    policies, 
    isLoading, 
    togglePolicy, 
    deletePolicy,
  } = useTaskApprovalPolicies(workspaceId);

  const { confirm, dialogProps, ConfirmationDialog: ConfirmDialog } = useConfirmation();

  const handleEdit = (policy: TaskApprovalPolicy) => {
    setEditingPolicy(policy);
    setShowBuilder(true);
  };

  const handleDelete = async (policy: TaskApprovalPolicy) => {
    const confirmed = await confirm({
      title: 'Delete Approval Policy',
      description: `Are you sure you want to delete "${policy.name}"? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });

    if (confirmed) {
      await deletePolicy(policy.id);
    }
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingPolicy(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Approval Policies
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure when tasks require approval before completion
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="text-lg font-medium mb-1">No approval policies</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Create approval policies to require manager approval before tasks can be marked complete.
            </p>
            <Button onClick={() => setShowBuilder(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create First Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onToggle={(enabled) => togglePolicy({ id: policy.id, isEnabled: enabled })}
              onEdit={() => handleEdit(policy)}
              onDelete={() => handleDelete(policy)}
            />
          ))}
        </div>
      )}

      <ApprovalPolicyBuilder
        workspaceId={workspaceId}
        open={showBuilder}
        onOpenChange={handleCloseBuilder}
        editingPolicy={editingPolicy ? {
          ...editingPolicy,
          id: editingPolicy.id,
        } : undefined}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

interface PolicyCardProps {
  policy: TaskApprovalPolicy;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PolicyCard({ policy, onToggle, onEdit, onDelete }: PolicyCardProps) {
  const hasCriteria = 
    (policy.appliesToCategories?.length ?? 0) > 0 ||
    (policy.appliesToPriorities?.length ?? 0) > 0 ||
    policy.minEstimatedHours;

  return (
    <Card className={!policy.isEnabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Switch
              checked={policy.isEnabled}
              onCheckedChange={onToggle}
            />
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {policy.name}
                {policy.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </CardTitle>
              {policy.description && (
                <CardDescription className="mt-1">
                  {policy.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Criteria */}
          {hasCriteria && (
            <div className="flex flex-wrap gap-1.5">
              {policy.appliesToCategories?.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {policy.appliesToPriorities?.map((pri) => (
                <Badge key={pri} variant="outline" className="text-xs">
                  {pri}
                </Badge>
              ))}
              {policy.minEstimatedHours && (
                <Badge variant="outline" className="text-xs">
                  ≥{policy.minEstimatedHours}h
                </Badge>
              )}
            </div>
          )}

          {/* Approval Chain */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {policy.approvalChain.length} level{policy.approvalChain.length !== 1 ? 's' : ''}:
            </span>
            <span className="text-foreground">
              {policy.approvalChain.map(l => getApprovalLevelDisplay(l)).join(' → ')}
            </span>
          </div>

          {/* Options */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {policy.autoApproveAfterHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Auto-approve after {policy.autoApproveAfterHours}h
              </span>
            )}
            {!policy.allowSelfApproval && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No self-approval
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
