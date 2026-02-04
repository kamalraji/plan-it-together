import { motion } from 'framer-motion';
import { 
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
  UserGroupIcon as UserGroupSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  ChartBarIcon as ChartSolid,
  Cog6ToothIcon as CogSolid
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export type MobileTab = 'overview' | 'tasks' | 'team' | 'communication' | 'analytics' | 'settings';

interface MobileNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  unreadCount?: number;
  pendingTaskCount?: number;
}

const NAV_ITEMS: Array<{
  id: MobileTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  badge?: 'unread' | 'pending';
}> = [
  { id: 'overview', label: 'Home', icon: HomeIcon, activeIcon: HomeIconSolid },
  { id: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon, activeIcon: ClipboardSolid, badge: 'pending' },
  { id: 'team', label: 'Team', icon: UserGroupIcon, activeIcon: UserGroupSolid },
  { id: 'communication', label: 'Chat', icon: ChatBubbleLeftRightIcon, activeIcon: ChatSolid, badge: 'unread' },
  { id: 'analytics', label: 'Stats', icon: ChartBarIcon, activeIcon: ChartSolid },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, activeIcon: CogSolid },
];

export function MobileNavigation({
  activeTab,
  onTabChange,
  unreadCount = 0,
  pendingTaskCount = 0,
}: MobileNavigationProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          // Get badge count
          let badgeCount = 0;
          if (item.badge === 'unread') badgeCount = unreadCount;
          if (item.badge === 'pending') badgeCount = pendingTaskCount;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px] min-h-[56px] rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label}${badgeCount > 0 ? `, ${badgeCount} new` : ''}`}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}

              <div className="relative z-10">
                <Icon className="w-6 h-6" />
                
                {/* Badge */}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-primary-foreground bg-destructive rounded-full">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>

              <span className={cn(
                "relative z-10 text-[10px] mt-1 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Styles to add to index.css for safe area support:
 * 
 * .safe-area-bottom {
 *   padding-bottom: env(safe-area-inset-bottom, 0);
 * }
 */
