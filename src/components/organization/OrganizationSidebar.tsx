import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarUserFooter } from './SidebarUserFooter';
import { SidebarHeaderContent } from './sidebar/SidebarHeader';
import { SidebarServiceItem } from './sidebar/SidebarServiceItem';
import { SidebarNavLink } from './sidebar/SidebarNavLink';
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
  PlusCircle,
  LayoutTemplate,
  List,
  ClipboardList,
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
  Settings,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceStatus } from '@/types';
import { buildHierarchyChain, slugify, buildWorkspaceUrl } from '@/lib/workspaceNavigation';

// Quick action definitions
const getEventQuickActions = (base: string) => [
  { title: 'Create New Event', path: `${base}/eventmanagement/create`, icon: PlusCircle, primary: true },
  { title: 'Browse Templates', path: `${base}/eventmanagement/templates`, icon: LayoutTemplate },
  { title: 'View All Events', path: `${base}/eventmanagement`, icon: List },
  { title: 'Registrations', path: `${base}/eventmanagement/registrations`, icon: ClipboardList },
  { title: 'Analytics', path: `${base}/analytics`, icon: BarChart3 },
];

const getWorkspaceQuickActions = (base: string) => [
  { title: 'Create Workspace', path: `${base}/workspaces`, icon: PlusCircle, primary: true },
  { title: 'Browse Templates', path: `${base}/templates`, icon: LayoutTemplate },
  { title: 'View All Workspaces', path: `${base}/workspaces?tab=list`, icon: List },
  { title: 'Team Analytics', path: `${base}/workspaces?tab=analytics`, icon: BarChart3 },
];

const getMarketplaceQuickActions = (base: string) => [
  { title: 'Manage Products', path: `${base}/settings/story`, icon: Package, primary: true },
  { title: 'Browse Services', path: `${base}/marketplace?tab=discover`, icon: Search },
  { title: 'My Bookings', path: `${base}/marketplace?tab=bookings`, icon: ShoppingCart },
  { title: 'Reviews', path: `${base}/marketplace?tab=reviews`, icon: Star },
];

const getAnalyticsQuickActions = (base: string) => [
  { title: 'View Reports', path: `${base}/analytics?tab=reports`, icon: FileText, primary: true },
  { title: 'Export Data', path: `${base}/analytics?tab=export`, icon: Download },
  { title: 'Date Range', path: `${base}/analytics?tab=daterange`, icon: Calendar },
  { title: 'Trends', path: `${base}/analytics?tab=trends`, icon: TrendingUp },
];

const getTeamQuickActions = (base: string) => [
  { title: 'Invite Members', path: `${base}/team?tab=invite`, icon: UserPlus, primary: true },
  { title: 'View Roles', path: `${base}/team?tab=roles`, icon: UserCog },
  { title: 'Pending Approvals', path: `${base}/team?tab=pending`, icon: Clock },
  { title: 'Active Members', path: `${base}/team?tab=members`, icon: UserCheck },
];

const getOrganizationQuickActions = (base: string) => [
  { title: 'All Organizations', path: `${base}/organizations/list`, icon: Building2, primary: true },
  { title: 'Manage Members', path: `${base}/organizations`, icon: Users },
  { title: 'Organization Settings', path: `${base}/settings`, icon: Settings },
  { title: 'Create New', path: `${base}/organizations/list?action=create`, icon: PlusCircle },
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

  // Expansion states - all collapsed by default
  const [eventExpanded, setEventExpanded] = useState(false);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(false);
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);
  const [organizationsExpanded, setOrganizationsExpanded] = useState(false);
  const [myWorkspacesExpanded, setMyWorkspacesExpanded] = useState(false);
  const [orgWorkspacesExpanded, setOrgWorkspacesExpanded] = useState(false);

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const selectedWorkspaceId = searchParams.get('workspaceId');

  // Check active states
  const isEventActive = currentPath.includes('/eventmanagement');
  const isWorkspacesActive = currentPath.includes('/workspaces');
  const isMarketplaceActive = currentPath.includes('/marketplace');
  const isAnalyticsActive = currentPath.includes('/analytics');
  const isTeamActive = currentPath.includes('/team');
  const isOrganizationsActive = currentPath.includes('/organizations');
  const isDashboardActive = currentPath.endsWith('/dashboard');

  // Fetch workspaces for sidebar with slug and workspace_type
  const { data: workspacesData } = useQuery({
    queryKey: ['sidebar-workspaces', organization?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return { myWorkspaces: [], orgWorkspaces: [], allWorkspacesFlat: [] };

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id, name, slug, status, event_id, organizer_id, parent_workspace_id, workspace_type,
          events!inner(id, name, slug, organization_id),
          workspace_team_members(user_id)
        `)
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allWorkspaces = (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        slug: row.slug || slugify(row.name),
        workspaceType: row.workspace_type,
        status: row.status as WorkspaceStatus,
        organizerId: row.organizer_id,
        parentWorkspaceId: row.parent_workspace_id,
        isOwner: row.organizer_id === user?.id,
        isMember: row.workspace_team_members?.some((m: any) => m.user_id === user?.id),
        event: {
          ...row.events,
          slug: row.events.slug || slugify(row.events.name),
        },
      }));

      const myWorkspaces = allWorkspaces.filter((w) => w.isOwner || w.isMember);
      const orgWorkspaces = allWorkspaces.filter((w) => !w.isOwner && !w.isMember);

      const buildTreeHierarchy = (workspaces: typeof allWorkspaces) => {
        const roots = workspaces.filter((w) => !w.parentWorkspaceId);
        const children = workspaces.filter((w) => w.parentWorkspaceId);
        return roots.map((root) => ({
          ...root,
          subWorkspaces: children.filter((c) => c.parentWorkspaceId === root.id),
        }));
      };

      return {
        myWorkspaces: buildTreeHierarchy(myWorkspaces),
        orgWorkspaces: buildTreeHierarchy(orgWorkspaces),
        allWorkspacesFlat: allWorkspaces,
      };
    },
    enabled: !!user?.id && !!organization?.id,
  });

  const handleWorkspaceClick = (workspace: any) => {
    // Build hierarchical URL for workspace navigation
    const allFlat = workspacesData?.allWorkspacesFlat || [];
    const workspaceDataForHierarchy = allFlat.map((w: any) => ({
      id: w.id,
      slug: w.slug,
      name: w.name,
      workspaceType: w.workspaceType,
      parentWorkspaceId: w.parentWorkspaceId,
    }));
    
    const hierarchy = buildHierarchyChain(workspace.id, workspaceDataForHierarchy);
    
    const eventSlug = workspace.event?.slug || slugify(workspace.event?.name || '');
    const url = buildWorkspaceUrl({
      orgSlug: orgSlug || '',
      eventSlug,
      eventId: workspace.eventId,
      hierarchy,
    });
    navigate(url);
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
            "w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl hover:bg-muted/50 transition-all duration-200 text-left group/ws",
            isSelected ? "bg-primary/10 text-primary" : "text-foreground/80"
          )}
          style={{ paddingLeft: `${10 + depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 hover:bg-muted-foreground/20 rounded-md flex-shrink-0"
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
            <FolderOpen className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate flex-1 group-hover/ws:text-foreground">{workspace.name}</span>
          {workspace.isOwner && (
            <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium flex-shrink-0">
              Owner
            </span>
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
      className="border-r border-border/20 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 backdrop-blur-xl"
    >
      <SidebarHeader className="p-0">
        <SidebarHeaderContent 
          organization={organization} 
          orgSlug={orgSlug} 
          isCollapsed={isCollapsed} 
        />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-1 overflow-y-auto">
        {/* Back to Organizer Home */}
        <SidebarGroup className="mb-2">
          <SidebarGroupContent>
            <SidebarNavLink
              to="/organizer/dashboard"
              icon={Home}
              title="Organizer Home"
              description="All organizations"
              isCollapsed={isCollapsed}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />

        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isDashboardActive}
                  tooltip="Dashboard"
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-300',
                    'hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5',
                    isDashboardActive && 'bg-gradient-to-r from-primary/15 to-primary/8 shadow-sm'
                  )}
                >
                  <a
                    href={`${base}/dashboard`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`${base}/dashboard`);
                    }}
                    className="flex w-full items-center gap-3"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
                        isDashboardActive
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25'
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                      )}
                    >
                      <LayoutDashboard className="h-[18px] w-[18px]" />
                    </div>
                    {!isCollapsed && (
                      <div className="flex flex-col items-start animate-fade-in">
                        <span className={cn("text-sm font-semibold tracking-tight", isDashboardActive && "text-primary")}>
                          Dashboard
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 font-medium">
                          Overview & metrics
                        </span>
                      </div>
                    )}
                    {isDashboardActive && !isCollapsed && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />

        {/* Services */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            {/* Event Management */}
            <SidebarServiceItem
              title="Event Management"
              description="Plan & organize"
              icon={CalendarDays}
              isActive={isEventActive}
              isExpanded={eventExpanded}
              onToggle={() => setEventExpanded(!eventExpanded)}
              quickActions={getEventQuickActions(base)}
              isCollapsed={isCollapsed}
            />

            {/* Workspaces */}
            <SidebarServiceItem
              title="Workspaces"
              description="Team collaboration"
              icon={Briefcase}
              isActive={isWorkspacesActive}
              isExpanded={workspacesExpanded}
              onToggle={() => setWorkspacesExpanded(!workspacesExpanded)}
              quickActions={getWorkspaceQuickActions(base)}
              isCollapsed={isCollapsed}
            />

            {/* Marketplace */}
            <SidebarServiceItem
              title="Marketplace"
              description="Products & services"
              icon={Store}
              isActive={isMarketplaceActive}
              isExpanded={marketplaceExpanded}
              onToggle={() => setMarketplaceExpanded(!marketplaceExpanded)}
              quickActions={getMarketplaceQuickActions(base)}
              isCollapsed={isCollapsed}
            />

            {/* Analytics */}
            <SidebarServiceItem
              title="Analytics"
              description="Performance insights"
              icon={BarChart3}
              isActive={isAnalyticsActive}
              isExpanded={analyticsExpanded}
              onToggle={() => setAnalyticsExpanded(!analyticsExpanded)}
              quickActions={getAnalyticsQuickActions(base)}
              isCollapsed={isCollapsed}
            />

            {/* Team */}
            <SidebarServiceItem
              title="Team"
              description="Members & roles"
              icon={Users}
              isActive={isTeamActive}
              isExpanded={teamExpanded}
              onToggle={() => setTeamExpanded(!teamExpanded)}
              quickActions={getTeamQuickActions(base)}
              isCollapsed={isCollapsed}
            />

            {/* Organizations */}
            <SidebarServiceItem
              title="Organizations"
              description="Manage orgs"
              icon={Building2}
              isActive={isOrganizationsActive}
              isExpanded={organizationsExpanded}
              onToggle={() => setOrganizationsExpanded(!organizationsExpanded)}
              quickActions={getOrganizationQuickActions(base)}
              isCollapsed={isCollapsed}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspaces Tree - shown when workspace section is expanded */}
        {workspacesExpanded && !isCollapsed && (
          <SidebarGroup>
            <div className="px-3 space-y-3">
              {/* My Workspaces */}
              <div>
                <button
                  onClick={() => setMyWorkspacesExpanded(!myWorkspacesExpanded)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    <span>My Workspaces</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
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
                  <ScrollArea className="max-h-[140px]">
                    <div className="space-y-0.5 mt-1">
                      {workspacesData?.myWorkspaces?.length === 0 ? (
                        <p className="px-3 py-2 text-[10px] text-muted-foreground/60 italic">No workspaces yet</p>
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
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Organization</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
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
                  <ScrollArea className="max-h-[140px]">
                    <div className="space-y-0.5 mt-1">
                      {workspacesData?.orgWorkspaces?.length === 0 ? (
                        <p className="px-3 py-2 text-[10px] text-muted-foreground/60 italic">No other workspaces</p>
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
          </SidebarGroup>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mx-3 my-3" />

        {/* Public Page Link */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
            Public
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavLink
              to={`/${orgSlug ?? ''}`.replace(/\/$/, '')}
              icon={ExternalLink}
              title="View Public Page"
              description="Opens in new tab"
              isCollapsed={isCollapsed}
              external
            />
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarUserFooter />
    </Sidebar>
  );
};

export default OrganizationSidebar;
