import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Workspace, WorkspaceType } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarUserFooter } from '@/components/organization/SidebarUserFooter';

import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  MessageSquare,
  ShoppingBag,
  FileText,
  UserCog,
  BarChart3,
  Download,
  Clock,
  ArrowLeft,
  Plus,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';

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
  | 'settings';

interface WorkspaceSidebarProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  orgSlug: string;
  canCreateSubWorkspace?: boolean;
  canInviteMembers?: boolean;
  onCreateSubWorkspace?: () => void;
  onInviteMember?: () => void;
  onManageSettings?: () => void;
}

interface NavItem {
  id: WorkspaceTab;
  name: string;
  icon: React.ElementType;
  group: 'core' | 'management' | 'analysis';
}

const navItems: NavItem[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, group: 'core' },
  { id: 'tasks', name: 'Tasks', icon: ClipboardList, group: 'core' },
  { id: 'team', name: 'Team', icon: Users, group: 'core' },
  { id: 'communication', name: 'Communication', icon: MessageSquare, group: 'core' },
  { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag, group: 'management' },
  { id: 'templates', name: 'Templates', icon: FileText, group: 'management' },
  { id: 'role-management', name: 'Roles', icon: UserCog, group: 'management' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, group: 'analysis' },
  { id: 'reports', name: 'Reports', icon: Download, group: 'analysis' },
  { id: 'audit', name: 'Audit Log', icon: Clock, group: 'analysis' },
];

const getWorkspaceTypeBadgeColor = (type?: string) => {
  switch (type) {
    case 'ROOT':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'DEPARTMENT':
      return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    case 'COMMITTEE':
      return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    case 'TEAM':
      return 'bg-green-500/20 text-green-600 border-green-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspace,
  activeTab,
  onTabChange,
  orgSlug,
  canCreateSubWorkspace = false,
  canInviteMembers = false,
  onCreateSubWorkspace,
  onInviteMember,
  onManageSettings,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [hierarchyExpanded, setHierarchyExpanded] = useState(true);

  // Fetch child workspaces for hierarchy (only for ROOT workspaces)
  const { data: childWorkspaces } = useQuery({
    queryKey: ['workspace-children', workspace.id],
    queryFn: async () => {
      if (workspace.workspaceType !== WorkspaceType.ROOT) return [];

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, parent_workspace_id')
        .eq('parent_workspace_id', workspace.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: workspace.workspaceType === WorkspaceType.ROOT,
  });

  const handleTabChange = (tabId: WorkspaceTab) => {
    const newParams = new URLSearchParams(searchParams);
    if (tabId === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabId);
    }
    newParams.delete('taskId');
    setSearchParams(newParams, { replace: true });
    onTabChange(tabId);
  };

  const handleBackToWorkspaces = () => {
    navigate(`/${orgSlug}/workspaces`);
  };

  const handleChildWorkspaceClick = async (childWorkspace: any) => {
    // Build hierarchical URL for child workspace
    const { data: allWorkspaces } = await supabase
      .from('workspaces')
      .select('id, name, slug, workspace_type, parent_workspace_id')
      .eq('event_id', workspace.eventId);

    if (!allWorkspaces) return;

    const { data: eventData } = await supabase
      .from('events')
      .select('slug, name')
      .eq('id', workspace.eventId)
      .single();

    if (!eventData) return;

    const eventSlug = eventData.slug || slugify(eventData.name);
    const hierarchy = buildHierarchyChain(
      childWorkspace.id,
      allWorkspaces.map((ws) => ({
        id: ws.id,
        slug: ws.slug || slugify(ws.name),
        name: ws.name,
        workspaceType: ws.workspace_type,
        parentWorkspaceId: ws.parent_workspace_id,
      }))
    );

    const url = buildWorkspaceUrl({
      orgSlug,
      eventSlug,
      eventId: workspace.eventId,
      hierarchy,
    });
    navigate(url);
  };

  // Group nav items
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/20 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 backdrop-blur-xl"
    >
      {/* Header with workspace info */}
      <SidebarHeader className="p-0">
        <div className="p-4 border-b border-border/30">
          {/* Back button */}
          <button
            onClick={handleBackToWorkspaces}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {!isCollapsed && <span>Back to Workspaces</span>}
          </button>

          {/* Workspace info */}
          {!isCollapsed && (
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground truncate text-sm">
                {workspace.name}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5',
                  getWorkspaceTypeBadgeColor(workspace.workspaceType)
                )}
              >
                {workspace.workspaceType || 'Workspace'}
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        
          {/* Core Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
              Core
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedItems['core']?.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      tooltip={item.name}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                        'hover:bg-muted/50',
                        activeTab === item.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />

          {/* Management Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedItems['management']?.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      tooltip={item.name}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                        'hover:bg-muted/50',
                        activeTab === item.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />

          {/* Analysis Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
              Analysis
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedItems['analysis']?.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      tooltip={item.name}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                        'hover:bg-muted/50',
                        activeTab === item.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Hierarchy Section - Only for ROOT workspaces */}
          {workspace.workspaceType === WorkspaceType.ROOT &&
            childWorkspaces &&
            childWorkspaces.length > 0 &&
            !isCollapsed && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />
                <SidebarGroup>
                  <button
                    onClick={() => setHierarchyExpanded(!hierarchyExpanded)}
                    className="flex items-center justify-between w-full px-3 py-1.5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                      Sub-Workspaces
                    </span>
                    {hierarchyExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {hierarchyExpanded && (
                    <SidebarGroupContent className="mt-2">
                      <div className="space-y-1 px-1">
                        {childWorkspaces.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleChildWorkspaceClick(child)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted/50 transition-colors text-left group"
                          >
                            <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate flex-1 text-foreground/80 group-hover:text-foreground">
                              {child.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[8px] px-1.5 py-0',
                                getWorkspaceTypeBadgeColor(child.workspace_type ?? undefined)
                              )}
                            >
                              {child.workspace_type || 'WS'}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  )}
                </SidebarGroup>
              </>
            )}

          {/* Quick Actions */}
          {!isCollapsed && (canCreateSubWorkspace || canInviteMembers || onManageSettings) && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
                  Quick Actions
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-1 px-1">
                    {canCreateSubWorkspace && onCreateSubWorkspace && (
                      <button
                        onClick={onCreateSubWorkspace}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Sub-Workspace</span>
                      </button>
                    )}
                    {canInviteMembers && onInviteMember && (
                      <button
                        onClick={onInviteMember}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted/50 transition-colors text-foreground/80"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Invite Member</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleTabChange('settings')}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors",
                        activeTab === 'settings' 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted/50 text-foreground/80"
                      )}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Settings</span>
                    </button>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
    </Sidebar>
  );
};

export default WorkspaceSidebar;
