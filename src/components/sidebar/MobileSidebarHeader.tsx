import React from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { sidebarStyles } from './sidebarConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

interface MobileSidebarHeaderProps {
  /** Current organization (if inside an org context) */
  currentOrg?: Organization | null;
  /** List of organizations for quick-switch dropdown */
  organizations?: Organization[];
  /** Callback when user selects a different org */
  onOrgChange?: (org: Organization) => void;
  /** Fallback title if no org context */
  title?: string;
  /** Fallback subtitle */
  subtitle?: string;
}

/**
 * Mobile-only sidebar header with close button, org name, and optional org-switcher.
 * Only renders on mobile (via isMobile from useSidebar).
 */
export const MobileSidebarHeader: React.FC<MobileSidebarHeaderProps> = ({
  currentOrg,
  organizations = [],
  onOrgChange,
  title = 'Organizer Console',
  subtitle,
}) => {
  const { isMobile, setOpenMobile } = useSidebar();

  // Only render on mobile
  if (!isMobile) return null;

  const displayName = currentOrg?.name || title;
  const displaySubtitle = currentOrg ? 'Organization Console' : subtitle;
  const showDropdown = organizations.length > 1 && onOrgChange;

  const handleClose = () => {
    setOpenMobile(false);
  };

  const handleOrgSelect = (org: Organization) => {
    onOrgChange?.(org);
    setOpenMobile(false);
  };

  return (
    <div className={cn(sidebarStyles.headerMobile, 'md:hidden')}>
      {/* Org logo / initial */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {currentOrg?.logo_url ? (
          <img
            src={currentOrg.logo_url}
            alt={currentOrg.name}
            className="h-6 w-6 rounded object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-primary uppercase">
            {displayName.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Title / Org-switcher */}
      <div className="flex flex-1 flex-col min-w-0">
        {showDropdown ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-left hover:opacity-80 transition-opacity">
                <span className={cn(sidebarStyles.textLabel, 'max-w-[180px]')}>
                  {displayName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrgSelect(org)}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold uppercase">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      org.name.slice(0, 2)
                    )}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {currentOrg?.id === org.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className={cn(sidebarStyles.textLabel, 'max-w-[200px]')}>
            {displayName}
          </span>
        )}
        {displaySubtitle && (
          <span className={sidebarStyles.textMeta}>{displaySubtitle}</span>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MobileSidebarHeader;
