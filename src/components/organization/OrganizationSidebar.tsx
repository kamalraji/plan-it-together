import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <SidebarContent className="space-y-4 py-4 animate-fade-in">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-1 space-y-1">
              {orgItems.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                    >
                      <NavLink
                        to={to}
                        end
                        className="flex flex-1 items-center gap-2 hover-scale"
                        activeClassName="text-primary font-semibold"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground group-data-[active=true]:bg-primary/20">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col items-start">
                          <span>{item.title}</span>
                          <span className="text-[11px] font-normal text-muted-foreground/70">
                            {item.title === 'Overview' && 'Key metrics & summary'}
                            {item.title === 'Events' && 'Manage and schedule events'}
                            {item.title === 'Analytics' && 'Performance & engagement'}
                            {item.title === 'Team' && 'Members & roles'}
                          </span>
                        </span>
                        {isActive && (
                          <span className="ml-auto h-6 w-1 rounded-full bg-primary" aria-hidden="true" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
            Public
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="group rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  <NavLink
                    to={`/${orgSlug ?? ''}`.replace(/\/$/, '')}
                    className="flex items-center gap-2 hover-scale"
                    activeClassName="text-primary font-semibold"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-medium text-primary">
                      ↗
                    </span>
                    <span className="flex flex-col items-start">
                      <span>View public page</span>
                      <span className="text-[11px] font-normal text-muted-foreground/70">Opens the public org profile</span>
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isThittamHubOrg && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/users')}
                    className="group rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                  >
                    <NavLink
                      to="/dashboard/admin/users"
                      className="flex items-center gap-2 hover-scale"
                      activeClassName="text-primary font-semibold"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                        UR
                      </span>
                      <span className="flex flex-col items-start">
                        <span>User Roles</span>
                        <span className="text-[11px] font-normal text-muted-foreground/70">Manage platform access</span>
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/organizers')}
                    className="group rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                  >
                    <NavLink
                      to="/dashboard/admin/organizers"
                      className="flex items-center gap-2 hover-scale"
                      activeClassName="text-primary font-semibold"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                        PO
                      </span>
                      <span className="flex flex-col items-start">
                        <span>Pending Organizers</span>
                        <span className="text-[11px] font-normal text-muted-foreground/70">Review organizer requests</span>
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizationSidebar;
