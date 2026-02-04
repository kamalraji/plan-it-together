import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  title: string;
  description?: string;
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

interface SidebarServiceItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  quickActions: QuickAction[];
  isCollapsed?: boolean;
}

export const SidebarServiceItem: React.FC<SidebarServiceItemProps> = ({
  title,
  description,
  icon: Icon,
  isActive,
  isExpanded,
  onToggle,
  quickActions,
  isCollapsed = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="group/service">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-300',
          'hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isActive && 'bg-gradient-to-r from-primary/12 to-primary/6 shadow-sm'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
              isActive
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/50 text-muted-foreground group-hover/service:bg-primary/15 group-hover/service:text-primary'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col items-start text-left">
              <span className={cn(
                "text-sm font-semibold tracking-tight transition-colors duration-200",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {title}
              </span>
              <span className="text-[10px] text-muted-foreground/80 font-medium">
                {description}
              </span>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 ml-5 pl-4 border-l-2 border-primary/20 space-y-0.5">
              {quickActions.map((action, index) => {
                const isActionActive = location.pathname === action.path || 
                  (action.path.includes('?') && location.pathname.includes(action.path.split('?')[0]) && 
                   location.search.includes(action.path.split('?')[1]?.split('=')[1] || ''));

                return (
                  <motion.button
                    key={index}
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.15 }}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all duration-200 text-left group/action",
                      "hover:bg-muted/60",
                      isActionActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-foreground/80",
                      action.primary && !isActionActive && "text-primary font-medium"
                    )}
                  >
                    <action.icon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 group-hover/action:scale-110",
                      isActionActive || action.primary ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate flex-1">{action.title}</span>
                    {isActionActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
