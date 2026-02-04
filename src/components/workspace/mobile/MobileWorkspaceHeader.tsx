import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Workspace } from '@/types';
import { cn } from '@/lib/utils';

interface MobileWorkspaceHeaderProps {
  workspace: Workspace;
  onMenuOpen?: () => void;
  onNotificationsOpen?: () => void;
  onSearchOpen?: () => void;
  onWorkspaceSwitch?: () => void;
  unreadNotifications?: number;
}

export function MobileWorkspaceHeader({
  workspace,
  onMenuOpen,
  onNotificationsOpen,
  onSearchOpen,
  onWorkspaceSwitch,
  unreadNotifications = 0,
}: MobileWorkspaceHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchToggle = () => {
    if (onSearchOpen) {
      onSearchOpen();
    } else {
      setShowSearch(!showSearch);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu + Workspace */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onMenuOpen && (
            <button
              onClick={onMenuOpen}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={onWorkspaceSwitch}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            {/* Workspace avatar */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                {workspace.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-semibold text-foreground truncate">
                  {workspace.name}
                </h1>
                {onWorkspaceSwitch && (
                  <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              {workspace.event?.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {workspace.event.name}
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSearchToggle}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          <button
            onClick={onNotificationsOpen}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center relative"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-primary-foreground bg-destructive rounded-full">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Inline Search Bar */}
      <AnimatePresence>
        {showSearch && !onSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, team, messages..."
                  className={cn(
                    "w-full pl-10 pr-10 py-3 bg-muted border-0 rounded-lg",
                    "text-sm placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "min-h-[48px]"
                  )}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/**
 * Styles to add to index.css for safe area support:
 * 
 * .safe-area-top {
 *   padding-top: env(safe-area-inset-top, 0);
 * }
 */
