import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, LineChart, Users } from 'lucide-react';

const orgItems = [
  { title: 'Overview', icon: LayoutDashboard, path: 'dashboard' },
  { title: 'Events', icon: CalendarDays, path: 'eventmanagement' },
  { title: 'Analytics', icon: LineChart, path: 'analytics' },
  { title: 'Team', icon: Users, path: 'team' },
];

export const OrganizationSidebar: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();
  const { state } = useSidebar();

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-r border-sidebar-border/60 bg-sidebar/80 backdrop-blur-xl"
    >
      <SidebarHeader className="gap-3 pb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase">
            Services
          </span>
          {!isCollapsed && (
            <p className="text-sm font-semibold text-sidebar-foreground">
              Core Console
            </p>
          )}
        </div>
        {!isCollapsed && (
          <SidebarInput
            placeholder="Search services..."
            className="mt-1 text-xs placeholder:text-muted-foreground/70"
          />
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1 pb-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground/90">
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-1 space-y-1">
              {orgItems.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="group data-[active=true]:bg-transparent">
                      <NavLink
                        to={to}
                        end
                        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                        activeClassName="font-semibold"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isThittamHubOrg && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground/90">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mt-1 space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/users')}
                    className="group data-[active=true]:bg-transparent"
                  >
                    <NavLink
                      to="/dashboard/admin/users"
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                      activeClassName="font-semibold"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        UR
                      </span>
                      {!isCollapsed && <span>User Roles</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/organizers')}
                    className="group data-[active=true]:bg-transparent"
                  >
                    <NavLink
                      to="/dashboard/admin/organizers"
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                      activeClassName="font-semibold"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        PO
                      </span>
                      {!isCollapsed && <span>Pending Organizers</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border/60 bg-sidebar/60">
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary">
              {orgSlug?.[0] ?? 'O'}
            </span>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-sidebar-foreground">{orgSlug ?? 'Organization'}</span>
                <span className="text-[11px] text-muted-foreground">Console</span>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default OrganizationSidebar;
