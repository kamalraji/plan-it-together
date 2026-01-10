import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Workspace, WorkspaceRoleScope, TaskStatus } from '@/types';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useWorkspaceMutations } from '@/hooks/useWorkspaceMutations';
import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  parseWorkspaceUrl, 
  buildWorkspaceUrl, 
  buildHierarchyChain, 
  slugify,
} from '@/lib/workspaceNavigation';

export type WorkspaceTab =
  | 'overview'
  | 'tasks'
  | 'team'
  | 'communication'
  | 'analytics'
  | 'reports'
  | 'marketplace'
  | 'templates'
  | 'audit'
  | 'role-management'
  | 'settings'
  | 'event-settings'
  | 'approvals'
  | 'checklists'
  | 'assign-shifts'
  | 'send-brief'
  | 'check-in'
  | 'create-team'
  | 'training-status'
  | 'performance-review';

export interface WorkspaceShellState {
  workspace: Workspace | undefined;
  userWorkspaces: Workspace[];
  tasks: any[];
  teamMembers: any[];
  isLoading: boolean;
  isTasksLoading: boolean;
  error: Error | null;
  activeTab: WorkspaceTab;
  activeRoleSpace: WorkspaceRoleScope;
  roleSpaces: WorkspaceRoleScope[];
  showSubWorkspaceModal: boolean;
  taskIdFromUrl: string | undefined;
}

export interface WorkspaceShellActions {
  setActiveTab: (tab: WorkspaceTab) => void;
  setActiveRoleSpace: (roleSpace: WorkspaceRoleScope) => void;
  setShowSubWorkspaceModal: (show: boolean) => void;
  handleInviteTeamMember: () => void;
  handleCreateTask: () => void;
  handleManageSettings: () => void;
  handleViewTasks: () => void;
  handleWorkspaceSwitch: (workspaceId: string) => void;
  handleTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  handleTaskDelete: (taskId: string) => void;
  handlePublishEvent: () => void;
}

export interface WorkspaceShellPermissions {
  canManageTasks: boolean;
  canPublishEvent: boolean;
  canManageSettings: boolean;
  canInviteMembers: boolean;
  canCreateSubWorkspace: boolean;
  isGlobalWorkspaceManager: boolean;
  currentMember: any;
}

export interface WorkspaceShellResult {
  state: WorkspaceShellState;
  actions: WorkspaceShellActions;
  permissions: WorkspaceShellPermissions;
  mutations: {
    isPublishingEvent: boolean;
    isCreatingTask: boolean;
  };
  orgSlug: string | undefined;
}

interface UseWorkspaceShellProps {
  workspaceId?: string;
  orgSlug?: string;
}

/**
 * Unified workspace shell hook
 * Provides shared state, actions, and permissions for both desktop and mobile views
 * Supports both legacy and hierarchical URL structures
 */
export function useWorkspaceShell({ 
  workspaceId: propWorkspaceId, 
  orgSlug: propOrgSlug 
}: UseWorkspaceShellProps = {}): WorkspaceShellResult {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Parse URL for hierarchical params
  const parsedUrl = parseWorkspaceUrl(location.pathname, location.search);
  
  // Get workspaceId from props, URL query params, or route params
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceIdFromQuery = searchParams.get('workspaceId') || undefined;
  const workspaceId = propWorkspaceId || workspaceIdFromQuery || paramWorkspaceId;
  
  // Resolve orgSlug from props or parsed URL
  const orgSlug = propOrgSlug || parsedUrl.orgSlug;
  
  const taskIdFromUrl = searchParams.get('taskId') || undefined;
  const tabFromUrl = searchParams.get('tab') as WorkspaceTab | null;
  const initialRoleScopeParam = searchParams.get('roleSpace') as WorkspaceRoleScope | null;

  // Determine initial tab: taskId takes priority, then URL tab, then default 'overview'
  const getInitialTab = (): WorkspaceTab => {
    if (taskIdFromUrl) return 'tasks';
    if (tabFromUrl) return tabFromUrl;
    return 'overview';
  };

  // State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(getInitialTab);
  const [activeRoleSpace, setActiveRoleSpace] = useState<WorkspaceRoleScope>(initialRoleScopeParam || 'ALL');
  const [showSubWorkspaceModal, setShowSubWorkspaceModal] = useState(false);

  // Data fetching
  const {
    workspace,
    isLoading,
    error,
    userWorkspaces,
    tasks,
    isTasksLoading,
    teamMembers,
  } = useWorkspaceData(workspaceId);

  // Permissions
  const permissions = useWorkspacePermissions({
    teamMembers,
    eventId: workspace?.eventId,
  });

  // Mutations
  const mutations = useWorkspaceMutations({
    workspaceId,
    eventId: workspace?.eventId,
    activeRoleSpace,
  });

  // Compute role spaces
  const roleSpaces: WorkspaceRoleScope[] = ['ALL', ...(teamMembers?.map((m) => m.role) || [])];

  // Load initial view from saved preferences
  useEffect(() => {
    if (!workspaceId || !user?.id) return;

    const loadInitialView = async () => {
      const { data, error: queryError } = await supabase
        .from('workspace_role_views')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id);

      if (queryError || !data || data.length === 0) return;

      const currentRoleView = data.find((view) => view.role_scope === activeRoleSpace);
      if (currentRoleView && activeTab === 'overview') {
        setActiveTab(currentRoleView.last_active_tab as WorkspaceTab);
      }
    };

    void loadInitialView();
  }, [workspaceId, user?.id]);

  // Actions
  const handleSetActiveTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    
    // Sync tab to URL query params
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'overview') {
        next.delete('tab'); // Default doesn't need to be in URL
      } else {
        next.set('tab', tab);
      }
      // Clear taskId when switching tabs (unless going to tasks)
      if (tab !== 'tasks') {
        next.delete('taskId');
      }
      return next;
    }, { replace: true });
    
    mutations.upsertRoleView(activeRoleSpace, tab);
  };

  const handleSetActiveRoleSpace = (roleSpace: WorkspaceRoleScope) => {
    setActiveRoleSpace(roleSpace);
    const next = new URLSearchParams(searchParams);
    if (roleSpace === 'ALL') {
      next.delete('roleSpace');
    } else {
      next.set('roleSpace', roleSpace);
    }
    setSearchParams(next);
    mutations.upsertRoleView(roleSpace, activeTab);
  };

  const handleInviteTeamMember = () => {
    if (!workspaceId) return;
    handleSetActiveTab('team');
  };

  const handleCreateTask = () => {
    if (!workspaceId || !permissions.canManageTasks) return;
    mutations.createTask();
  };

  const handleManageSettings = () => {
    if (!workspaceId || !permissions.isGlobalWorkspaceManager) return;
    // Navigate to settings tab instead of separate page
    handleSetActiveTab('settings');
  };

  const handleViewTasks = () => {
    handleSetActiveTab('tasks');
  };

  const handleWorkspaceSwitch = async (newWorkspaceId: string) => {
    // Fetch workspace data to build hierarchical URL
    const { data: newWorkspace } = await supabase
      .from('workspaces')
      .select('id, name, slug, workspace_type, parent_workspace_id, event_id')
      .eq('id', newWorkspaceId)
      .single();
    
    if (newWorkspace && orgSlug) {
      const { data: eventData } = await supabase
        .from('events')
        .select('slug, name')
        .eq('id', newWorkspace.event_id)
        .single();
      
      const { data: workspacesData } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, parent_workspace_id')
        .eq('event_id', newWorkspace.event_id);
      
      if (eventData && workspacesData) {
        const eventSlug = eventData.slug || slugify(eventData.name);
        const hierarchy = buildHierarchyChain(newWorkspaceId, workspacesData.map(ws => ({
          id: ws.id,
          slug: ws.slug || slugify(ws.name),
          name: ws.name,
          workspaceType: ws.workspace_type,
          parentWorkspaceId: ws.parent_workspace_id,
        })));
        
        const newUrl = buildWorkspaceUrl(
          { orgSlug, eventSlug, eventId: newWorkspace.event_id, hierarchy }
        );
        navigate(newUrl);
        return;
      }
    }
    
    // Fallback - redirect to dashboard if hierarchical URL cannot be built
    console.warn('[WorkspaceShell] Cannot build workspace URL, redirecting to dashboard');
    navigate('/dashboard');
  };

  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    if (!permissions.canManageTasks) return;
    mutations.updateTaskStatus(taskId, status);
  };

  const handleTaskDelete = (taskId: string) => {
    if (!permissions.canManageTasks) return;
    mutations.deleteTask(taskId);
  };

  const handlePublishEvent = () => {
    mutations.publishEvent();
  };

  return {
    state: {
      workspace,
      userWorkspaces,
      tasks,
      teamMembers,
      isLoading,
      isTasksLoading,
      error: error as Error | null,
      activeTab,
      activeRoleSpace,
      roleSpaces,
      showSubWorkspaceModal,
      taskIdFromUrl,
    },
    actions: {
      setActiveTab: handleSetActiveTab,
      setActiveRoleSpace: handleSetActiveRoleSpace,
      setShowSubWorkspaceModal,
      handleInviteTeamMember,
      handleCreateTask,
      handleManageSettings,
      handleViewTasks,
      handleWorkspaceSwitch,
      handleTaskStatusChange,
      handleTaskDelete,
      handlePublishEvent,
    },
    permissions: {
      canManageTasks: permissions.canManageTasks,
      canPublishEvent: permissions.canPublishEvent,
      canManageSettings: permissions.canManageSettings,
      canInviteMembers: permissions.canInviteMembers,
      canCreateSubWorkspace: permissions.canCreateSubWorkspace,
      isGlobalWorkspaceManager: permissions.isGlobalWorkspaceManager,
      currentMember: permissions.currentMember,
    },
    mutations: {
      isPublishingEvent: mutations.isPublishingEvent,
      isCreatingTask: mutations.isCreatingTask,
    },
    orgSlug,
  };
}
