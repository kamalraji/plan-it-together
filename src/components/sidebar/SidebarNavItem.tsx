import React from 'react';
import { NavLink } from '@/components/NavLink';
import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem as ShadcnSidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { sidebarStyles, type SidebarMenuItem as MenuItemType } from './sidebarConfig';

interface SidebarNavItemProps {
  item: MenuItemType;
  to: string;
  isActive: boolean;
  showDescription?: boolean;
}

/**
 * Unified nav item component for sidebar menus.
 * Shows icon, title, optional description, and active indicator.
 */
export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  to,
  isActive,
  showDescription = true,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <ShadcnSidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(
          sidebarStyles.menuItemBase,
          sidebarStyles.menuItemHover,
          isActive && sidebarStyles.menuItemActive
        )}
      >
        <NavLink to={to} className="flex w-full items-center gap-3">
          <span
            className={cn(
              sidebarStyles.iconContainer,
              sidebarStyles.iconSize,
              isActive
                ? sidebarStyles.iconContainerActive
                : sidebarStyles.iconContainerDefault
            )}
          >
            <item.icon className="h-4 w-4" />
          </span>
          {!isCollapsed && (
            <span className="flex flex-col items-start animate-fade-in min-w-0">
              <span className="truncate">{item.title}</span>
              {showDescription && item.description && (
                <span className={sidebarStyles.textDescription}>
                  {item.description}
                </span>
              )}
            </span>
          )}
          {isActive && !isCollapsed && (
            <span className={sidebarStyles.activeIndicator} />
          )}
        </NavLink>
      </SidebarMenuButton>
    </ShadcnSidebarMenuItem>
  );
};

interface SidebarNavGroupProps {
  items: MenuItemType[];
  basePath: string;
  currentPath: string;
  showDescriptions?: boolean;
}

/**
 * Renders a group of SidebarNavItems with proper active detection.
 */
export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  items,
  basePath,
  currentPath,
  showDescriptions = true,
}) => {
  return (
    <SidebarMenu className="space-y-1">
      {items.map((item) => {
        const to = `${basePath}/${item.path}`;
        const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

        return (
          <SidebarNavItem
            key={item.path}
            item={item}
            to={to}
            isActive={isActive}
            showDescription={showDescriptions}
          />
        );
      })}
    </SidebarMenu>
  );
};

export default SidebarNavItem;
