import React from 'react';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  organization: {
    name: string;
    slug: string;
    logo_url?: string | null;
  };
  user: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ organization, user }) => {
  const navigate = useNavigate();
  
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border h-16">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo/Org Name */}
        <div className="flex items-center gap-3">
          {organization.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt={organization.name} 
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-semibold text-foreground truncate max-w-[140px]">
            {organization.name}
          </span>
        </div>

        {/* Right: Notifications & Avatar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={() => navigate(`/${organization.slug}/notifications`)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          
          <Avatar 
            className="h-9 w-9 cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={user?.avatarUrl} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
