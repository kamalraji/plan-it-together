import { 
  Bars3Icon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Workspace } from '../../../types';

interface MobileWorkspaceHeaderProps {
  workspace: Workspace;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function MobileWorkspaceHeader({ 
  workspace, 
  isMenuOpen, 
  onMenuToggle 
}: MobileWorkspaceHeaderProps) {
  // Get user initials for avatar
  const getUserInitials = () => {
    return workspace.name?.charAt(0).toUpperCase() || 'W';
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo and workspace info */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="p-1.5 -ml-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <Bars3Icon className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-1.5">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">T1</span>
              </div>
              <span className="text-base font-semibold text-foreground">Thittam1Hub</span>
            </div>
          </div>
        </div>

        {/* Right side - Notification and Avatar */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <BellIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">
              {getUserInitials()}
            </span>
          </button>
        </div>
      </div>
      
      {/* User email subtitle */}
      <div className="px-4 pb-2 -mt-1">
        <p className="text-xs text-muted-foreground truncate">
          {workspace.event?.name || workspace.name}
        </p>
      </div>
    </div>
  );
}
