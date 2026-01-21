import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkspaceRole, WorkspaceType } from '@/types';
import { 
  getContextualRolesForWorkspace, 
  getDefaultRoleForWorkspace,
  ContextualRoleOption 
} from '@/lib/workspaceRoleContext';
import { getWorkspaceRoleLabel } from '@/lib/workspaceHierarchy';
import { Star, Sparkles } from 'lucide-react';

interface WorkspaceRoleSelectProps {
  workspace: {
    id: string;
    name: string;
    workspaceType?: WorkspaceType;
    departmentId?: string;
  };
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  currentUserRole?: WorkspaceRole | null;
  disabled?: boolean;
  className?: string;
}

export function WorkspaceRoleSelect({
  workspace,
  value,
  onChange,
  currentUserRole,
  disabled = false,
  className,
}: WorkspaceRoleSelectProps) {
  // Get contextual roles based on workspace
  const contextualRoles = useMemo(() => {
    return getContextualRolesForWorkspace(
      {
        workspaceType: workspace.workspaceType,
        workspaceName: workspace.name,
        departmentId: workspace.departmentId,
      },
      currentUserRole
    );
  }, [workspace.workspaceType, workspace.name, workspace.departmentId, currentUserRole]);

  // Group roles by category
  const groupedRoles = useMemo(() => {
    const groups: Record<string, ContextualRoleOption[]> = {
      Managers: [],
      Leads: [],
      Coordinators: [],
    };

    contextualRoles.forEach(role => {
      if (groups[role.group]) {
        groups[role.group].push(role);
      }
    });

    return groups;
  }, [contextualRoles]);

  // Get primary and recommended roles for display
  const primaryRole = contextualRoles.find(r => r.isPrimary);
  const recommendedRoles = contextualRoles.filter(r => r.isRecommended && !r.isPrimary);

  // Get the label for the current value
  const currentLabel = useMemo(() => {
    const role = contextualRoles.find(r => r.value === value);
    return role?.label || getWorkspaceRoleLabel(value);
  }, [contextualRoles, value]);

  // Check if there are any roles available
  if (contextualRoles.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2 border border-border rounded-md bg-muted/30">
        No roles available to assign
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as WorkspaceRole)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a role">
          <span className="flex items-center gap-2">
            {primaryRole?.value === value && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            )}
            {recommendedRoles.some(r => r.value === value) && (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
            {currentLabel}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        {/* Primary/Recommended Section */}
        {(primaryRole || recommendedRoles.length > 0) && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Recommended for this workspace
            </SelectLabel>
            {primaryRole && (
              <SelectItem 
                value={primaryRole.value}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {primaryRole.label}
                  {primaryRole.description && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({primaryRole.description})
                    </span>
                  )}
                </span>
              </SelectItem>
            )}
            {recommendedRoles.map(role => (
              <SelectItem 
                key={role.value} 
                value={role.value}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  {role.label}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Managers Section */}
        {groupedRoles.Managers.filter(r => !r.isPrimary && !r.isRecommended).length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">
              Managers
            </SelectLabel>
            {groupedRoles.Managers
              .filter(r => !r.isPrimary && !r.isRecommended)
              .map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
          </SelectGroup>
        )}

        {/* Leads Section */}
        {groupedRoles.Leads.filter(r => !r.isPrimary && !r.isRecommended).length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">
              Leads
            </SelectLabel>
            {groupedRoles.Leads
              .filter(r => !r.isPrimary && !r.isRecommended)
              .map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
          </SelectGroup>
        )}

        {/* Coordinators Section */}
        {groupedRoles.Coordinators.filter(r => !r.isPrimary && !r.isRecommended).length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">
              Coordinators
            </SelectLabel>
            {groupedRoles.Coordinators
              .filter(r => !r.isPrimary && !r.isRecommended)
              .map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

// Export helper for getting default role
export { getDefaultRoleForWorkspace };
