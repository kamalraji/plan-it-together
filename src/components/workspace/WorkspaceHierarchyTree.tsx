import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Users, Building2, Layers, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  getWorkspaceTypeLabel,
  getWorkspaceRoleLabel,
  WORKSPACE_DEPARTMENTS,
  DEPARTMENT_COMMITTEES,
} from '@/lib/workspaceHierarchy';
import { WorkspaceType, WorkspaceRole, TeamMember } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { RoleDelegationModal } from './RoleDelegationModal';
import { useAuth } from '@/hooks/useAuth';
import { buildHierarchyChain, slugify, buildWorkspaceUrl } from '@/lib/workspaceNavigation';

interface WorkspaceNode {
  id: string;
  name: string;
  parentWorkspaceId: string | null;
  status: string;
  workspaceType: WorkspaceType | null;
  departmentId: string | null;
  children: WorkspaceNode[];
  depth: number;
  teamMembers?: TeamMember[];
}

interface WorkspaceHierarchyTreeProps {
  eventId: string;
  currentWorkspaceId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
}

export function WorkspaceHierarchyTree({
  eventId,
  currentWorkspaceId,
  onWorkspaceSelect,
}: WorkspaceHierarchyTreeProps) {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [delegationModal, setDelegationModal] = useState<{
    open: boolean;
    workspaceId: string;
    workspaceName: string;
    responsibleRole: WorkspaceRole;
    currentHolder?: TeamMember;
    teamMembers: TeamMember[];
  } | null>(null);

  // Fetch event data for hierarchical URLs
  const { data: event } = useQuery({
    queryKey: ['workspace-hierarchy-event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, name')
        .eq('id', eventId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: workspaces, isLoading, refetch } = useQuery({
    queryKey: ['workspace-hierarchy', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, parent_workspace_id, status, workspace_type, department_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch team members for all workspaces
  const { data: allTeamMembers } = useQuery({
    queryKey: ['workspace-hierarchy-members', eventId],
    queryFn: async () => {
      if (!workspaces || workspaces.length === 0) return {};

      const workspaceIds = workspaces.map(ws => ws.id);
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role, status, joined_at, workspace_id')
        .in('workspace_id', workspaceIds)
        .eq('status', 'active');

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group by workspace_id
      const grouped: Record<string, TeamMember[]> = {};
      (data || []).forEach(member => {
        const profile = profileMap.get(member.user_id);
        const teamMember: TeamMember = {
          id: member.id,
          userId: member.user_id,
          role: member.role as WorkspaceRole,
          status: member.status,
          joinedAt: member.joined_at,
          user: {
            id: member.user_id,
            name: profile?.full_name || 'Unknown User',
            email: '',
          },
        };
        if (!grouped[member.workspace_id]) {
          grouped[member.workspace_id] = [];
        }
        grouped[member.workspace_id].push(teamMember);
      });

      return grouped;
    },
    enabled: !!workspaces && workspaces.length > 0,
  });

  // Build tree structure from flat list
  const tree = useMemo(() => {
    if (!workspaces) return [];

    const nodeMap = new Map<string, WorkspaceNode>();
    const roots: WorkspaceNode[] = [];

    // First pass: create all nodes with team members
    workspaces.forEach((ws) => {
      nodeMap.set(ws.id, {
        id: ws.id,
        name: ws.name,
        parentWorkspaceId: ws.parent_workspace_id,
        status: ws.status,
        workspaceType: ws.workspace_type as WorkspaceType | null,
        departmentId: ws.department_id,
        children: [],
        depth: 1,
        teamMembers: allTeamMembers?.[ws.id] || [],
      });
    });

    // Second pass: build tree structure
    workspaces.forEach((ws) => {
      const node = nodeMap.get(ws.id);
      if (!node) return;

      if (ws.parent_workspace_id) {
        const parent = nodeMap.get(ws.parent_workspace_id);
        if (parent) {
          node.depth = parent.depth + 1;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Auto-expand path to current workspace
    if (currentWorkspaceId) {
      const expandPath = (nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (node?.parentWorkspaceId) {
          setExpandedNodes((prev) => new Set([...prev, node.parentWorkspaceId!]));
          expandPath(node.parentWorkspaceId);
        }
      };
      expandPath(currentWorkspaceId);
    }

    return roots;
  }, [workspaces, currentWorkspaceId, allTeamMembers]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSelect = (workspaceId: string) => {
    if (onWorkspaceSelect) {
      onWorkspaceSelect(workspaceId);
    } else if (orgSlug && event && workspaces) {
      // Build hierarchical URL
      const workspaceData = workspaces.map(ws => ({
        id: ws.id,
        slug: ws.slug || slugify(ws.name),
        name: ws.name,
        workspaceType: ws.workspace_type,
        parentWorkspaceId: ws.parent_workspace_id,
      }));
      
      const hierarchy = buildHierarchyChain(workspaceId, workspaceData);
      const eventSlug = event.slug || slugify(event.name);
      
      const url = buildWorkspaceUrl({
        orgSlug,
        eventSlug,
        eventId: event.id,
        hierarchy,
      });
      
      navigate(url);
    } else {
      // Missing data for hierarchical URL, redirecting to org dashboard
      if (orgSlug) {
        navigate(`/${orgSlug}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const getLevelLabel = (node: WorkspaceNode): string => {
    if (node.workspaceType) {
      return getWorkspaceTypeLabel(node.workspaceType);
    }
    // Fallback based on depth
    switch (node.depth) {
      case 1:
        return 'Root';
      case 2:
        return 'Department';
      case 3:
        return 'Committee';
      case 4:
        return 'Team';
      default:
        return 'Workspace';
    }
  };

  const getLevelColor = (node: WorkspaceNode): string => {
    const type = node.workspaceType;
    switch (type) {
      case WorkspaceType.ROOT:
        return 'text-primary';
      case WorkspaceType.DEPARTMENT:
        return 'text-blue-600 dark:text-blue-400';
      case WorkspaceType.COMMITTEE:
        return 'text-amber-600 dark:text-amber-400';
      case WorkspaceType.TEAM:
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        // Fallback based on depth
        switch (node.depth) {
          case 1:
            return 'text-primary';
          case 2:
            return 'text-blue-600 dark:text-blue-400';
          case 3:
            return 'text-amber-600 dark:text-amber-400';
          case 4:
            return 'text-emerald-600 dark:text-emerald-400';
          default:
            return 'text-muted-foreground';
        }
    }
  };

  const getTypeIcon = (node: WorkspaceNode) => {
    const type = node.workspaceType;
    switch (type) {
      case WorkspaceType.DEPARTMENT:
        return Building2;
      case WorkspaceType.COMMITTEE:
        return Users;
      case WorkspaceType.TEAM:
        return Layers;
      default:
        return Folder;
    }
  };

  const getLevelBadgeStyle = (node: WorkspaceNode): string => {
    const type = node.workspaceType;
    switch (type) {
      case WorkspaceType.ROOT:
        return 'bg-primary/10 text-primary';
      case WorkspaceType.DEPARTMENT:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case WorkspaceType.COMMITTEE:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case WorkspaceType.TEAM:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        // Fallback based on depth
        switch (node.depth) {
          case 1:
            return 'bg-primary/10 text-primary';
          case 2:
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
          case 3:
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
          case 4:
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
          default:
            return 'bg-muted text-muted-foreground';
        }
    }
  };

  // Get the responsible role for a workspace node
  const getNodeResponsibleRole = (node: WorkspaceNode): WorkspaceRole | null => {
    if (!node.workspaceType) return null;

    // For ROOT, always return WORKSPACE_OWNER
    if (node.workspaceType === WorkspaceType.ROOT) {
      return WorkspaceRole.WORKSPACE_OWNER;
    }

    // For DEPARTMENT, find the manager role based on department_id
    if (node.workspaceType === WorkspaceType.DEPARTMENT && node.departmentId) {
      const dept = WORKSPACE_DEPARTMENTS.find(d => d.id === node.departmentId);
      return dept?.managerRole || null;
    }

    // For COMMITTEE, we need to derive the committee ID from the name
    if (node.workspaceType === WorkspaceType.COMMITTEE && node.departmentId) {
      const committees = DEPARTMENT_COMMITTEES[node.departmentId];
      // Try to match by name (case-insensitive)
      const committee = committees?.find(
        c => c.name.toLowerCase() === node.name.toLowerCase()
      );
      return committee?.leadRole || null;
    }

    // For TEAM, return coordinator role based on parent committee
    if (node.workspaceType === WorkspaceType.TEAM && node.departmentId) {
      const committees = DEPARTMENT_COMMITTEES[node.departmentId];
      // For teams, we'd need parent context - return first coordinator as fallback
      if (committees && committees.length > 0) {
        return committees[0].coordinatorRole;
      }
    }

    return null;
  };

  const getRoleBadgeStyle = (level: number): string => {
    switch (level) {
      case 1:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 2:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 3:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 4:
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderNode = (node: WorkspaceNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isCurrent = node.id === currentWorkspaceId;
    const hasChildren = node.children.length > 0;
    const TypeIcon = getTypeIcon(node);
    const responsibleRole = getNodeResponsibleRole(node);
    
    // Find who holds the responsible role
    const roleHolder = responsibleRole
      ? node.teamMembers?.find((m) => m.role === responsibleRole)
      : undefined;

    const handleDelegateClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (responsibleRole) {
        setDelegationModal({
          open: true,
          workspaceId: node.id,
          workspaceName: node.name,
          responsibleRole,
          currentHolder: roleHolder,
          teamMembers: node.teamMembers || [],
        });
      }
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
            isCurrent
              ? 'bg-primary/10 border border-primary/20'
              : 'hover:bg-muted',
          )}
          style={{ paddingLeft: `${(node.depth - 1) * 16 + 8}px` }}
          onClick={() => handleSelect(node.id)}
        >
          {/* Expand/Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className={cn(
              'p-0.5 rounded hover:bg-muted-foreground/10',
              !hasChildren && 'invisible',
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Type Icon */}
          {isExpanded && hasChildren ? (
            <FolderOpen className={cn('h-4 w-4', getLevelColor(node))} />
          ) : (
            <TypeIcon className={cn('h-4 w-4', getLevelColor(node))} />
          )}

          {/* Name and Badges */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-sm truncate',
                isCurrent ? 'font-semibold text-foreground' : 'text-foreground/80',
              )}
            >
              {node.name}
            </span>
            
            {/* Level Badge */}
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide shrink-0',
                getLevelBadgeStyle(node),
              )}
            >
              {getLevelLabel(node)}
            </span>

            {/* Responsible Role Badge with Holder */}
            {responsibleRole && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleDelegateClick}
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-medium tracking-wide shrink-0 flex items-center gap-1 hover:ring-1 hover:ring-primary/30 transition-all',
                        getRoleBadgeStyle(node.depth),
                      )}
                    >
                      <Shield className="h-2.5 w-2.5" />
                      <span className="hidden sm:inline">
                        {roleHolder ? roleHolder.user.name.split(' ')[0] : 'Vacant'}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{getWorkspaceRoleLabel(responsibleRole)}</p>
                    {roleHolder ? (
                      <p className="text-xs text-muted-foreground">
                        Held by: {roleHolder.user.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Position vacant - click to assign</p>
                    )}
                    <p className="text-xs text-primary mt-1">Click to delegate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Team member count */}
          {(node.teamMembers?.length || 0) > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {node.teamMembers?.length}
            </span>
          )}

          {/* Children count */}
          {hasChildren && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
              <Folder className="h-3 w-3" />
              {node.children.length}
            </span>
          )}
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-0 top-0 bottom-0 border-l border-border"
              style={{ marginLeft: `${(node.depth - 1) * 16 + 20}px` }}
            />
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tree.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No workspaces found for this event.
      </div>
    );
  }

  return (
    <>
      <div className="py-2">
        {/* Legend */}
        <div className="px-3 pb-2 mb-2 border-b border-border">
          <div className="flex flex-wrap gap-3 text-[10px] mb-2">
            <span className="text-muted-foreground font-medium">Levels:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">L1 Root</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">L2 Department</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">L3 Committee</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">L4 Team</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px]">
            <span className="text-muted-foreground font-medium">Roles:</span>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-purple-500" />
              <span className="text-muted-foreground">Owner</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-indigo-500" />
              <span className="text-muted-foreground">Manager</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-orange-500" />
              <span className="text-muted-foreground">Lead</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-teal-500" />
              <span className="text-muted-foreground">Coordinator</span>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="space-y-0.5">{tree.map(renderNode)}</div>

        {/* Depth info */}
        <div className="px-3 pt-3 mt-2 border-t border-border text-[10px] text-muted-foreground">
          Max hierarchy depth: 4 levels
        </div>
      </div>

      {/* Role Delegation Modal */}
      {delegationModal && (
        <RoleDelegationModal
          open={delegationModal.open}
          onOpenChange={(open) => {
            if (!open) setDelegationModal(null);
          }}
          workspaceId={delegationModal.workspaceId}
          workspaceName={delegationModal.workspaceName}
          responsibleRole={delegationModal.responsibleRole}
          currentHolder={delegationModal.currentHolder}
          teamMembers={delegationModal.teamMembers}
          currentUserId={user?.id}
          onDelegated={() => {
            refetch();
            setDelegationModal(null);
          }}
        />
      )}
    </>
  );
}
