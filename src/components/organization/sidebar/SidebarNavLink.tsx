import React from 'react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

interface SidebarNavLinkProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  isCollapsed: boolean;
  isActive?: boolean;
  external?: boolean;
}

export const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({
  to,
  icon: Icon,
  title,
  description,
  isCollapsed,
  isActive = false,
  external = false,
}) => {
  const className = cn(
    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-300',
    'hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/30',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
    isActive && 'bg-muted/50'
  );

  const content = (
    <>
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
        "bg-muted/40 text-muted-foreground",
        "group-hover:bg-primary/15 group-hover:text-primary group-hover:shadow-sm"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      {!isCollapsed && (
        <div className="flex flex-col items-start animate-fade-in">
          <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
            {title}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/70">
            {description}
          </span>
        </div>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink to={to} className={className}>
      {content}
    </NavLink>
  );
};
