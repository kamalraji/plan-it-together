import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useCurrentOrganization } from './OrganizationContext';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Home, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MobileSidebarHeader,
  SidebarNavGroup,
  orgServices,
  adminMenuItems,
  sidebarStyles,
} from '@/components/sidebar';

export const OrganizationSidebar: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const organization = useCurrentOrganization();
  const { data: memberOrganizations } = useMyMemberOrganizations();

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';

  const handleOrgChange = (org: { slug: string }) => {
    navigate(`/${org.slug}/dashboard`);
  };

  return (
    <Sidebar collapsible="offcanvas" className={sidebarStyles.sidebar}>
      {/* Mobile header with close button and org-switcher */}
      <MobileSidebarHeader
        currentOrg={organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo_url: organization.logo_url,
        } : undefined}
        organizations={memberOrganizations || []}
        onOrgChange={handleOrgChange}
      />

      {/* Desktop header */}
      {!isMobile && (
        <SidebarHeader className={sidebarStyles.header}>
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
                  <span className={cn(sidebarStyles.textLabel, 'max-w-[140px]')}>
                    {organization?.name || orgSlug}
                  </span>
                  <span className={sidebarStyles.textMeta}>
                    Organization Console
                  </span>
                </div>
              )}
            </div>
            <SidebarTrigger className="h-7 w-7 shrink-0" />
          </div>
        </SidebarHeader>
      )}

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
                    sidebarStyles.menuItemBase,
                    'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <NavLink
                    to="/organizer/dashboard"
                    className="flex w-full items-center gap-3"
                  >
                    <span className={cn(
                      sidebarStyles.iconContainer,
                      sidebarStyles.iconSizeSmall,
                      'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    )}>
                      <Home className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span className="text-sm">Organizer Home</span>
                        <span className={sidebarStyles.textMeta}>
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
          <SidebarGroupLabel className={sidebarStyles.sectionLabel}>
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavGroup
              items={orgServices}
              basePath={base}
              currentPath={currentPath}
              showDescriptions={true}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Public Page Link */}
        <SidebarGroup>
          <SidebarGroupLabel className={sidebarStyles.sectionLabel}>
            Public
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="View Public Page"
                  className={cn(
                    sidebarStyles.menuItemBase,
                    'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <a
                    href={`/${orgSlug ?? ''}`.replace(/\/$/, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3"
                  >
                    <span className={cn(
                      sidebarStyles.iconContainer,
                      sidebarStyles.iconSizeSmall,
                      'bg-primary/10 text-primary group-hover:bg-primary/20'
                    )}>
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span>View Public Page</span>
                        <span className={sidebarStyles.textMeta}>
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
            <SidebarGroupLabel className={sidebarStyles.sectionLabel}>
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminMenuItems.map((item) => {
                  const isActive = currentPath.startsWith(item.path);

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          sidebarStyles.menuItemBase,
                          'hover:bg-muted/70 hover:text-foreground',
                          isActive && 'bg-primary/15 text-primary font-medium'
                        )}
                      >
                        <NavLink
                          to={item.path}
                          className="flex w-full items-center gap-3"
                        >
                          <span
                            className={cn(
                              sidebarStyles.iconContainer,
                              sidebarStyles.iconSizeSmall,
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          {!isCollapsed && (
                            <span className="flex flex-col items-start animate-fade-in">
                              <span>{item.title}</span>
                              {item.description && (
                                <span className={sidebarStyles.textMeta}>
                                  {item.description}
                                </span>
                              )}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizationSidebar;
