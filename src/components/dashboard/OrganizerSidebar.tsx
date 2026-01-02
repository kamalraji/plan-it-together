import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Home, ChevronDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MobileSidebarHeader,
  orgServices,
  sidebarStyles,
} from '@/components/sidebar';

export const OrganizerSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const { data: memberOrganizations, isLoading } = useMyMemberOrganizations();

  const isOrganizerDashboardActive = currentPath === '/organizer/dashboard';

  const handleOrgChange = (org: { slug: string }) => {
    navigate(`/${org.slug}/dashboard`);
  };

  return (
    <Sidebar collapsible="offcanvas" className={sidebarStyles.sidebar}>
      {/* Mobile header with close button and org-switcher */}
      <MobileSidebarHeader
        title="Organizer Console"
        subtitle="All organizations"
        organizations={memberOrganizations || []}
        onOrgChange={handleOrgChange}
      />

      {/* Desktop header */}
      {!isMobile && (
        <SidebarHeader className={sidebarStyles.header}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              {!isCollapsed && (
                <span className="text-sm font-semibold text-foreground animate-fade-in">
                  Organizer Console
                </span>
              )}
            </div>
            <SidebarTrigger className="h-7 w-7" />
          </div>
        </SidebarHeader>
      )}

      <SidebarContent className="px-2 py-3 space-y-2 overflow-y-auto">
        {/* Organizer Dashboard CTA */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isOrganizerDashboardActive}
                  tooltip="Organizer Dashboard"
                  className={cn(
                    sidebarStyles.menuItemBase,
                    sidebarStyles.menuItemHover,
                    isOrganizerDashboardActive && sidebarStyles.menuItemActive
                  )}
                >
                  <NavLink
                    to="/organizer/dashboard"
                    className="flex w-full items-center gap-3"
                  >
                    <span
                      className={cn(
                        sidebarStyles.iconContainer,
                        sidebarStyles.iconSize,
                        isOrganizerDashboardActive
                          ? sidebarStyles.iconContainerActive
                          : sidebarStyles.iconContainerDefault
                      )}
                    >
                      <Home className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span>Organizer Home</span>
                        <span className={sidebarStyles.textDescription}>
                          All organizations overview
                        </span>
                      </span>
                    )}
                    {isOrganizerDashboardActive && !isCollapsed && (
                      <span className={sidebarStyles.activeIndicator} />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organizations List */}
        <SidebarGroup>
          <SidebarGroupLabel className={sidebarStyles.sectionLabel}>
            Your Organizations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !memberOrganizations || memberOrganizations.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground">
                No organizations yet
              </div>
            ) : (
              <SidebarMenu className="space-y-1">
                {memberOrganizations.map((org: any) => {
                  const orgBasePath = `/${org.slug}`;
                  const isOrgActive = currentPath.startsWith(orgBasePath);
                  const isDefaultOpen = isOrgActive;

                  return (
                    <Collapsible
                      key={org.id}
                      defaultOpen={isDefaultOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={org.name}
                            className={cn(
                              sidebarStyles.menuItemBase,
                              'hover:bg-muted/70',
                              isOrgActive && 'bg-muted/50 font-medium'
                            )}
                          >
                            <span
                              className={cn(
                                sidebarStyles.iconContainer,
                                sidebarStyles.iconSizeSmall,
                                'text-xs font-bold uppercase',
                                isOrgActive
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                              )}
                            >
                              {org.name?.slice(0, 2) || 'OR'}
                            </span>
                            {!isCollapsed && (
                              <>
                                <span className="flex flex-1 flex-col items-start overflow-hidden animate-fade-in">
                                  <span className="truncate max-w-[140px]">{org.name}</span>
                                  {org.role && (
                                    <span className={sidebarStyles.textMeta}>
                                      {org.role}
                                    </span>
                                  )}
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <SidebarMenuSub className={sidebarStyles.subMenu}>
                            {orgServices.map((item) => {
                              const itemPath = `${orgBasePath}/${item.path}`;
                              const isItemActive =
                                currentPath === itemPath ||
                                currentPath.startsWith(`${itemPath}/`);

                              return (
                                <SidebarMenuSubItem key={item.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isItemActive}
                                    className={cn(
                                      sidebarStyles.subMenuItem,
                                      sidebarStyles.subMenuItemHover,
                                      isItemActive && sidebarStyles.subMenuItemActive
                                    )}
                                  >
                                    <NavLink
                                      to={itemPath}
                                      className="flex w-full items-center gap-2.5"
                                    >
                                      <item.icon
                                        className={cn(
                                          'h-3.5 w-3.5 transition-colors',
                                          isItemActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground group-hover/subitem:text-foreground'
                                        )}
                                      />
                                      <span className="flex-1">{item.title}</span>
                                      {isItemActive && (
                                        <span className={sidebarStyles.activeIndicatorDot} />
                                      )}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizerSidebar;
