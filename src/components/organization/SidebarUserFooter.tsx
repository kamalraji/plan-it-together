import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSidebar, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronUp, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const SidebarUserFooter: React.FC = () => {
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/dashboard/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/settings');
    setIsOpen(false);
  };

  return (
    <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'w-full justify-between rounded-xl px-3 py-2.5',
                  'hover:bg-sidebar-accent transition-colors duration-200',
                  isOpen && 'bg-sidebar-accent'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col items-start min-w-0 animate-fade-in">
                      <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-sidebar-foreground/60 truncate max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronUp
                    className={cn(
                      'h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="mt-1 space-y-1 rounded-xl bg-sidebar-accent/50 p-1">
                <button
                  onClick={handleProfileClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </CollapsibleContent>
          </SidebarMenuItem>
        </SidebarMenu>
      </Collapsible>
    </SidebarFooter>
  );
};

export default SidebarUserFooter;
