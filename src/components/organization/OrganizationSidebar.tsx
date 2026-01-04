import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useCurrentOrganization } from './OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarUserFooter } from './SidebarUserFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Store,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  PlusCircle,
  LayoutTemplate,
  List,
  ClipboardList,
  ExternalLink,
  Shield,
  BarChart3,
  Package,
  ShoppingCart,
  Star,
  Search,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  UserPlus,
  UserCog,
  Clock,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceStatus } from '@/types';

interface OrgMenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const orgServices: OrgMenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', description: 'Overview & metrics' },
  // Event Management is now a separate expandable section
  // Workspace is now a separate expandable section
  // Marketplace is now a separate expandable section
  // Analytics is now a separate expandable section
  // Team is now a separate expandable section
];

interface TeamQuickAction {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

const getTeamQuickActions = (base: string): TeamQuickAction[] => [
  {
    title: 'Invite Members',
    description: 'Add new team members',
    path: `${base}/team?tab=invite`,
    icon: UserPlus,
    primary: true,
  },
  {
    title: 'View Roles',
    description: 'Manage member roles',
    path: `${base}/team?tab=roles`,
    icon: UserCog,
  },
  {
    title: 'Pending Approvals',
    description: 'Review requests',
    path: `${base}/team?tab=pending`,
    icon: Clock,
  },
  {
    title: 'Active Members',
    description: 'All team members',
    path: `${base}/team?tab=members`,
    icon: UserCheck,
  },
];

interface AnalyticsQuickAction {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

const getAnalyticsQuickActions = (base: string): AnalyticsQuickAction[] => [
  {
    title: 'View Reports',
    description: 'Performance dashboards',
    path: `${base}/analytics?tab=reports`,
    icon: FileText,
    primary: true,
  },
  {
    title: 'Export Data',
    description: 'Download analytics data',
    path: `${base}/analytics?tab=export`,
    icon: Download,
  },
  {
    title: 'Date Range',
    description: 'Filter by time period',
    path: `${base}/analytics?tab=daterange`,
    icon: Calendar,
  },
  {
    title: 'Trends',
    description: 'Growth & engagement',
    path: `${base}/analytics?tab=trends`,
    icon: TrendingUp,
  },
];

interface MarketplaceQuickAction {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

const getMarketplaceQuickActions = (base: string): MarketplaceQuickAction[] => [
  {
    title: 'Manage Products',
    description: 'Add or edit your products',
    path: `${base}/settings/story`,
    icon: Package,
    primary: true,
  },
  {
    title: 'Browse Services',
    description: 'Find vendors for events',
    path: `${base}/marketplace?tab=discover`,
    icon: Search,
  },
  {
    title: 'My Bookings',
    description: 'View service bookings',
    path: `${base}/marketplace?tab=bookings`,
    icon: ShoppingCart,
  },
  {
    title: 'Reviews',
    description: 'Rate your experiences',
    path: `${base}/marketplace?tab=reviews`,
    icon: Star,
  },
];

interface EventQuickAction {
  title: string;
  description: string;
  path: string;
  primary?: boolean;
}

interface WorkspaceQuickAction {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

const getWorkspaceQuickActions = (base: string): WorkspaceQuickAction[] => [
  {
    title: 'Create Workspace',
    description: 'Start a new collaborative workspace',
    path: `${base}/workspaces`,
    icon: PlusCircle,
    primary: true,
  },
  {
    title: 'Browse Templates',
    description: 'Use pre-built workspace templates',
    path: `${base}/workspaces?tab=templates`,
    icon: LayoutTemplate,
  },
  {
    title: 'View All Workspaces',
    description: 'Manage your existing workspaces',
    path: `${base}/workspaces?tab=list`,
    icon: List,
  },
  {
    title: 'Team Analytics',
    description: 'View team performance metrics',
    path: `${base}/workspaces?tab=analytics`,
    icon: BarChart3,
  },
];

const getEventQuickActions = (base: string): EventQuickAction[] => [
  {
    title: 'Create New Event',
    description: 'Start planning your next event',
    path: `${base}/eventmanagement/create`,
    primary: true,
  },
  {
    title: 'Browse Templates',
    description: 'Use pre-built event templates',
    path: `${base}/eventmanagement/templates`,
  },
  {
    title: 'View All Events',
    description: 'Manage your existing events',
    path: `${base}/eventmanagement`,
  },
  {
    title: 'Registrations',
    description: 'Review registrations',
    path: `${base}/eventmanagement/registrations`,
  },
  {
    title: 'Analytics',
    description: 'Event performance metrics',
    path: `${base}/analytics`,
  },
];

export const OrganizationSidebar: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const organization = useCurrentOrganization();
  const { user } = useAuth();

  const [eventManagementExpanded, setEventManagementExpanded] = useState(true);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(true);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [myWorkspacesExpanded, setMyWorkspacesExpanded] = useState(true);
  const [orgWorkspacesExpanded, setOrgWorkspacesExpanded] = useState(false);

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';
  const isEventManagementActive = currentPath.includes('/eventmanagement');
  const isWorkspacesActive = currentPath.includes('/workspaces');
  const isMarketplaceActive = currentPath.includes('/marketplace');
  const isAnalyticsActive = currentPath.includes('/analytics');
  const isTeamActive = currentPath.includes('/team');
  const selectedWorkspaceId = searchParams.get('workspaceId');
  
  const eventQuickActions = getEventQuickActions(base);
  const marketplaceQuickActions = getMarketplaceQuickActions(base);
  const analyticsQuickActions = getAnalyticsQuickActions(base);
  const teamQuickActions = getTeamQuickActions(base);
  const workspaceQuickActions = getWorkspaceQuickActions(base);

  // Fetch workspaces for sidebar
  const { data: workspacesData } = useQuery({
    queryKey: ['sidebar-workspaces', organization?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return { myWorkspaces: [], orgWorkspaces: [] };

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id, name, status, event_id, organizer_id, parent_workspace_id,
          events!inner(id, name, organization_id),
          workspace_team_members(user_id)
        `)
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allWorkspaces = (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        organizerId: row.organizer_id,
        parentWorkspaceId: row.parent_workspace_id,
        isOwner: row.organizer_id === user?.id,
        isMember: row.workspace_team_members?.some((m: any) => m.user_id === user?.id),
        event: row.events,
      }));

      const myWorkspaces = allWorkspaces.filter((w) => w.isOwner || w.isMember);
      const orgWorkspaces = allWorkspaces.filter((w) => !w.isOwner && !w.isMember);

      // Build hierarchy
      const buildHierarchy = (workspaces: typeof allWorkspaces) => {
        const roots = workspaces.filter((w) => !w.parentWorkspaceId);
        const children = workspaces.filter((w) => w.parentWorkspaceId);
        return roots.map((root) => ({
          ...root,
          subWorkspaces: children.filter((c) => c.parentWorkspaceId === root.id),
        }));
      };

      return {
        myWorkspaces: buildHierarchy(myWorkspaces),
        orgWorkspaces: buildHierarchy(orgWorkspaces),
      };
    },
    enabled: !!user?.id && !!organization?.id,
  });

  const handleWorkspaceClick = (workspace: any) => {
    navigate(`${base}/workspaces/${workspace.eventId}?workspaceId=${workspace.id}`);
  };

  // Workspace item component
  const WorkspaceItem = ({ workspace, depth = 0 }: { workspace: any; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;
    const isSelected = selectedWorkspaceId === workspace.id;

    return (
      <div>
        <button
          onClick={() => handleWorkspaceClick(workspace)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
            isSelected ? "bg-primary/10 text-primary" : "text-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 hover:bg-muted-foreground/20 rounded flex-shrink-0"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}
          {expanded && hasChildren ? (
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate flex-1">{workspace.name}</span>
          {workspace.isOwner && (
            <span className="text-[9px] px-1 py-0.5 bg-primary/10 text-primary rounded flex-shrink-0">Owner</span>
          )}
        </button>
        {hasChildren && expanded && (
          <div>
            {workspace.subWorkspaces.map((sub: any) => (
              <WorkspaceItem key={sub.id} workspace={sub} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/40 bg-sidebar"
    >
      <SidebarHeader className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-primary uppercase">
                  {organization?.name?.slice(0, 2) || orgSlug?.slice(0, 2) || 'OR'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fade-in">
                <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                  {organization?.name || orgSlug}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Organization Console
                </span>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-7 w-7 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-2 overflow-y-auto">
        {/* Back to Organizer Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Back to Organizer Home"
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                    'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <NavLink
                    to="/organizer/dashboard"
                    className="flex w-full items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Home className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span className="text-sm">Organizer Home</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          All organizations
                        </span>
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organization Services */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {orgServices.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'hover:bg-primary/10 hover:text-primary',
                        isActive && 'bg-primary/15 text-primary shadow-sm'
                      )}
                    >
                      <NavLink
                        to={to}
                        end={item.path === 'dashboard'}
                        className="flex w-full items-center gap-3"
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {!isCollapsed && (
                          <span className="flex flex-col items-start animate-fade-in">
                            <span>{item.title}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {item.description}
                            </span>
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                          <span className="ml-auto h-6 w-1 rounded-full bg-primary animate-scale-in" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Event Management Section */}
        <SidebarGroup>
          <button
            onClick={() => setEventManagementExpanded(!eventManagementExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-primary/10',
              isEventManagementActive && 'bg-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                  isEventManagementActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <CalendarDays className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <span className="flex flex-col items-start">
                  <span className={cn("text-sm font-medium", isEventManagementActive && "text-primary")}>
                    Event Management
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Manage events
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${base}/eventmanagement/create`);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Create event"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {eventManagementExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {eventManagementExpanded && !isCollapsed && (
            <div className="mt-2 ml-3 border-l border-border/50 pl-2 space-y-0.5">
              {eventQuickActions.map((action, index) => {
                const isActive = currentPath === action.path;
                const ActionIcon = action.primary ? PlusCircle : 
                  action.title.includes('Template') ? LayoutTemplate :
                  action.title.includes('View') ? List :
                  action.title.includes('Analytics') ? BarChart3 : ClipboardList;
                
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground",
                      action.primary && "text-primary font-medium"
                    )}
                  >
                    <ActionIcon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      action.primary ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate flex-1">{action.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </SidebarGroup>

        {/* Workspaces Section */}
        <SidebarGroup>
          <button
            onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-primary/10',
              isWorkspacesActive && 'bg-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                  isWorkspacesActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Briefcase className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <span className="flex flex-col items-start">
                  <span className={cn("text-sm font-medium", isWorkspacesActive && "text-primary")}>
                    Workspaces
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Team collaboration
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${base}/workspaces`);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Create workspace"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {workspacesExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {workspacesExpanded && !isCollapsed && (
            <div className="mt-2 ml-3 border-l border-border/50 pl-2 space-y-2">
              {/* Quick Actions */}
              <div className="space-y-0.5">
                {workspaceQuickActions.map((action, index) => {
                  const isActive = currentPath.includes('/workspaces') && 
                    (action.path.includes('?tab=') ? location.search.includes(action.path.split('?')[1]) : false);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
                        isActive ? "bg-primary/10 text-primary" : "text-foreground",
                        action.primary && "text-primary font-medium"
                      )}
                    >
                      <action.icon className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        action.primary ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="truncate flex-1">{action.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-border/50" />
              {/* My Workspaces */}
              <div className="mb-2">
                <button
                  onClick={() => setMyWorkspacesExpanded(!myWorkspacesExpanded)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>My Workspaces</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-muted px-1 rounded">
                      {workspacesData?.myWorkspaces?.length || 0}
                    </span>
                    {myWorkspacesExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                </button>
                {myWorkspacesExpanded && (
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-0.5 mt-1">
                      {workspacesData?.myWorkspaces?.length === 0 ? (
                        <p className="px-2 py-1 text-[10px] text-muted-foreground italic">No workspaces yet</p>
                      ) : (
                        workspacesData?.myWorkspaces?.map((workspace: any) => (
                          <WorkspaceItem key={workspace.id} workspace={workspace} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Organization Workspaces */}
              <div>
                <button
                  onClick={() => setOrgWorkspacesExpanded(!orgWorkspacesExpanded)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Organization</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-muted px-1 rounded">
                      {workspacesData?.orgWorkspaces?.length || 0}
                    </span>
                    {orgWorkspacesExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                </button>
                {orgWorkspacesExpanded && (
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-0.5 mt-1">
                      {workspacesData?.orgWorkspaces?.length === 0 ? (
                        <p className="px-2 py-1 text-[10px] text-muted-foreground italic">No other workspaces</p>
                      ) : (
                        workspacesData?.orgWorkspaces?.map((workspace: any) => (
                          <WorkspaceItem key={workspace.id} workspace={workspace} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </SidebarGroup>

        {/* Marketplace Section */}
        <SidebarGroup>
          <button
            onClick={() => setMarketplaceExpanded(!marketplaceExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-primary/10',
              isMarketplaceActive && 'bg-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                  isMarketplaceActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Store className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <span className="flex flex-col items-start">
                  <span className={cn("text-sm font-medium", isMarketplaceActive && "text-primary")}>
                    Marketplace
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Products & services
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${base}/settings/story`);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Add product"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {marketplaceExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {marketplaceExpanded && !isCollapsed && (
            <div className="mt-2 ml-3 border-l border-border/50 pl-2 space-y-0.5">
              {marketplaceQuickActions.map((action, index) => {
                const isActive = currentPath === action.path || currentPath.includes(action.path.split('?')[0]);
                
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground",
                      action.primary && "text-primary font-medium"
                    )}
                  >
                    <action.icon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      action.primary ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate flex-1">{action.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </SidebarGroup>

        {/* Analytics Section */}
        <SidebarGroup>
          <button
            onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-primary/10',
              isAnalyticsActive && 'bg-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                  isAnalyticsActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <BarChart3 className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <span className="flex flex-col items-start">
                  <span className={cn("text-sm font-medium", isAnalyticsActive && "text-primary")}>
                    Analytics
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Performance insights
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                {analyticsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {analyticsExpanded && !isCollapsed && (
            <div className="mt-2 ml-3 border-l border-border/50 pl-2 space-y-0.5">
              {analyticsQuickActions.map((action, index) => {
                const isActive = currentPath.includes('/analytics') && 
                  (action.path.includes('?tab=') ? location.search.includes(action.path.split('?')[1]) : false);
                
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground",
                      action.primary && "text-primary font-medium"
                    )}
                  >
                    <action.icon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      action.primary ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate flex-1">{action.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </SidebarGroup>

        {/* Team Section */}
        <SidebarGroup>
          <button
            onClick={() => setTeamExpanded(!teamExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-primary/10',
              isTeamActive && 'bg-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                  isTeamActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Users className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <span className="flex flex-col items-start">
                  <span className={cn("text-sm font-medium", isTeamActive && "text-primary")}>
                    Team
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Members & roles
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${base}/team?tab=invite`);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="Invite member"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {teamExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </button>

          {teamExpanded && !isCollapsed && (
            <div className="mt-2 ml-3 border-l border-border/50 pl-2 space-y-0.5">
              {teamQuickActions.map((action, index) => {
                const isActive = currentPath.includes('/team') && 
                  (action.path.includes('?tab=') ? location.search.includes(action.path.split('?')[1]) : false);
                
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted/70 transition-colors text-left",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground",
                      action.primary && "text-primary font-medium"
                    )}
                  >
                    <action.icon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      action.primary ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate flex-1">{action.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </SidebarGroup>

        {/* Public Page Link */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Public
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="View Public Page"
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground"
                >
                  <a
                    href={`/${orgSlug ?? ''}`.replace(/\/$/, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span>View Public Page</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          Opens in new tab
                        </span>
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only for thittam1hub */}
        {isThittamHubOrg && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith(`/${orgSlug}/admin/users`)}
                    tooltip="User Roles"
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      'hover:bg-muted/70 hover:text-foreground',
                      currentPath.startsWith(`/${orgSlug}/admin/users`) && 'bg-primary/15 text-primary font-medium'
                    )}
                  >
                    <NavLink
                      to={`/${orgSlug}/admin/users`}
                      className="flex w-full items-center gap-3"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
                          currentPath.startsWith(`/${orgSlug}/admin/users`)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="flex flex-col items-start animate-fade-in">
                          <span>User Roles</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Manage platform access
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith(`/${orgSlug}/admin/activity`)}
                    tooltip="Activity Logs"
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      'hover:bg-muted/70 hover:text-foreground',
                      currentPath.startsWith(`/${orgSlug}/admin/activity`) && 'bg-primary/15 text-primary font-medium'
                    )}
                  >
                    <NavLink
                      to={`/${orgSlug}/admin/activity`}
                      className="flex w-full items-center gap-3"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
                          currentPath.startsWith(`/${orgSlug}/admin/activity`)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                        )}
                      >
                        <Building2 className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="flex flex-col items-start animate-fade-in">
                          <span>Activity Logs</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Admin audit trail
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarUserFooter />
    </Sidebar>
  );
};

export default OrganizationSidebar;
