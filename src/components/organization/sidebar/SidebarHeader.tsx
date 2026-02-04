import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  organization: {
    name?: string;
    logo_url?: string | null;
  } | null;
  orgSlug?: string;
  isCollapsed: boolean;
}

export const SidebarHeaderContent: React.FC<SidebarHeaderProps> = ({
  organization,
  orgSlug,
  isCollapsed,
}) => {
  return (
    <div className="border-b border-border/30 px-3 py-4 bg-gradient-to-b from-background to-transparent">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 transition-all duration-300",
            isCollapsed ? "h-9 w-9" : "h-10 w-10"
          )}>
            {organization?.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary uppercase tracking-tight">
                {organization?.name?.slice(0, 2) || orgSlug?.slice(0, 2) || 'OR'}
              </span>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-fade-in">
              <span className="text-sm font-bold text-foreground truncate max-w-[130px] tracking-tight">
                {organization?.name || orgSlug}
              </span>
              <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide uppercase">
                Console
              </span>
            </div>
          )}
        </div>
        <SidebarTrigger className={cn(
          "h-8 w-8 shrink-0 rounded-xl transition-all duration-200",
          "hover:bg-muted/60 hover:text-primary",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        )} />
      </div>
    </div>
  );
};
