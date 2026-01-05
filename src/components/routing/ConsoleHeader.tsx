import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from './NotificationCenter';

interface ConsoleHeaderProps {
  user: any;
  onServiceChange: (service: string) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
}

interface ServiceDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
}

// Mock service definitions - these will be moved to a configuration file
const services: ServiceDefinition[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Overview and quick access to all services',
    icon: '🏠',
    category: 'Core',
  },
  {
    id: 'events',
    name: 'events',
    displayName: 'Event Management',
    description: 'Create and manage events',
    icon: '📅',
    category: 'Management',
  },
  {
    id: 'workspaces',
    name: 'workspaces',
    displayName: 'Workspaces',
    description: 'Collaborate on event preparation',
    icon: '👥',
    category: 'Collaboration',
  },
  {
    id: 'marketplace',
    name: 'marketplace',
    displayName: 'Marketplace',
    description: 'Find and book services',
    icon: '🛒',
    category: 'Services',
  },
  {
    id: 'organizations',
    name: 'organizations',
    displayName: 'Organizations',
    description: 'Manage your organizations',
    icon: '🏢',
    category: 'Management',
  },
  {
    id: 'analytics',
    name: 'analytics',
    displayName: 'Analytics',
    description: 'View performance metrics',
    icon: '📊',
    category: 'Insights',
  },
];

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  user,
  onServiceChange,
  onSearch,
  onLogout,
  onToggleMobileMenu,
}) => {
  const [isServiceSwitcherOpen, setIsServiceSwitcherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const serviceSwitcherRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const orgSlugCandidate = currentPath.split('/')[1];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard' && orgSlugCandidate !== 'organizer';
  const PRIMARY_ADMIN_ORG_SLUG = 'thittam1hub';
  const isOrganizerOrAdmin = user?.role === 'ORGANIZER' || user?.role === 'SUPER_ADMIN';
  const isOrganizerRootDashboard = currentPath.startsWith('/organizer/dashboard');

  // Get the org slug to use - either from current context or fallback to primary admin org for organizers
  const effectiveOrgSlug = isOrgContext ? orgSlugCandidate : (isOrganizerOrAdmin ? PRIMARY_ADMIN_ORG_SLUG : null);

  const getServicePath = (serviceId: string): string => {
    // For organizers/admins, always use org-scoped routes
    if (effectiveOrgSlug && isOrganizerOrAdmin) {
      switch (serviceId) {
        case 'dashboard':
          return `/${effectiveOrgSlug}/dashboard`;
        case 'events':
          return `/${effectiveOrgSlug}/eventmanagement`;
        case 'workspaces':
          return `/${effectiveOrgSlug}/workspaces`;
        case 'marketplace':
          return `/${effectiveOrgSlug}/marketplace`;
        case 'organizations':
          return `/${effectiveOrgSlug}/settings`;
        case 'analytics':
          return `/${effectiveOrgSlug}/analytics`;
        default:
          return `/${effectiveOrgSlug}/dashboard`;
      }
    }

    // For participants (non-organizer/admin), use dashboard routes
    switch (serviceId) {
      case 'dashboard':
        return '/dashboard';
      case 'events':
        return '/events';
      case 'workspaces':
        return '/dashboard'; // Participants don't have workspaces access
      case 'marketplace':
        return '/marketplace';
      case 'organizations':
        return '/dashboard/organizations/join';
      case 'analytics':
        return '/dashboard'; // Participants don't have analytics access
      default:
        return '/dashboard';
    }
  };

  const currentService: string = (() => {
    for (const service of services) {
      const pathForService = getServicePath(service.id);
      if (
        currentPath === pathForService ||
        currentPath.startsWith(pathForService + '/')
      ) {
        return service.id;
      }
    }
    return 'dashboard';
  })();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceSwitcherRef.current && !serviceSwitcherRef.current.contains(event.target as Node)) {
        setIsServiceSwitcherOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentServiceData = services.find(s => s.id === currentService);

  const handleServiceSelect = (serviceId: string) => {
    setIsServiceSwitcherOpen(false);
    onServiceChange(serviceId);
    const target = getServicePath(serviceId);
    navigate(target);
  };
   return (
     <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50 h-14 sm:h-16">
       <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
         {/* Left Section */}
         <div className="flex items-center gap-3 sm:gap-4">
            {/* Sidebar Toggle Button */}
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
 
           {/* Logo */}
           <Link to={getServicePath('dashboard')} className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">T1</span>
              </div>
              <span className="hidden sm:block text-lg sm:text-xl font-semibold text-foreground">
                Thittam1Hub
              </span>
            </Link>

          {/* Service Switcher - visible only for organizer/admin roles, but hidden on organizer root dashboard */}
           {(user?.role === 'ORGANIZER' || user?.role === 'SUPER_ADMIN') && !isOrganizerRootDashboard && (
             <div className="relative" ref={serviceSwitcherRef}>
               <button
                 onClick={() => setIsServiceSwitcherOpen(!isServiceSwitcherOpen)}
                 className="flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground bg-muted border border-border rounded-md hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
               >
                 <span className="hidden sm:block truncate max-w-[140px]">
                   {currentServiceData?.displayName || 'Dashboard'}
                 </span>
                 <ChevronDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
               </button>
 
               {/* Service Switcher Dropdown */}
               {isServiceSwitcherOpen && (
                 <div className="absolute top-full left-0 mt-1 w-72 sm:w-80 bg-card rounded-md shadow-lg ring-1 ring-border z-50 animate-enter">
                   <div className="p-3 sm:p-4">
                     <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 tracking-tight">Switch Service</h3>
                     <div className="space-y-0.5">
                       {services.map((service) => (
                         <button
                           key={service.id}
                           onClick={() => handleServiceSelect(service.id)}
                           className={`w-full flex items-start gap-2 sm:gap-3 px-2.5 py-1.5 text-xs sm:text-sm rounded-md text-left transition-colors duration-150 ${
                             service.id === currentService
                               ? 'bg-primary/10 text-primary border-l-2 border-primary'
                               : 'text-muted-foreground hover:bg-muted'
                           }`}
                         >
                           <div className="flex-1 min-w-0">
                             <div className="font-medium truncate text-foreground">{service.displayName}</div>
                             <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                               {service.description}
                             </div>
                           </div>
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}

        </div>

         {/* Center Section - Global Search */}
         <div className="flex-1 max-w-lg mx-3 sm:mx-4">
           <GlobalSearch
             onSearch={onSearch}
             placeholder="Search services, resources..."
             showShortcuts={true}
           />
         </div>

         {/* Right Section */}
         <div className="flex items-center gap-3 sm:gap-4">
           {/* Notification Center */}
           <NotificationCenter />
 
           {/* User Menu */}
           <div className="relative" ref={userMenuRef}>
             <button
               onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
               className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
             >
               <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
               <span className="hidden sm:block truncate max-w-[120px]">{user?.name || 'User'}</span>
               <ChevronDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
             </button>

             {/* User Menu Dropdown */}
             {isUserMenuOpen && (
               <div className="absolute top-full right-0 mt-1 w-56 bg-card rounded-md shadow-lg ring-1 ring-border z-50">
                 <div className="p-3 sm:p-4 border-b border-border">
                   <div className="text-sm font-medium text-foreground">{user?.name || 'User'}</div>
                   <div className="text-xs sm:text-sm text-muted-foreground">{user?.email || 'user@example.com'}</div>
                   <div className="text-[11px] text-muted-foreground mt-1">{user?.role || 'User'}</div>
                 </div>
                 <div className="py-1">
                   <Link
                     to="/dashboard/profile"
                     className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:bg-muted"
                     onClick={() => setIsUserMenuOpen(false)}
                   >
                     <UserCircleIcon className="h-4 w-4" />
                     <span>Profile</span>
                   </Link>
                   <Link
                     to="/dashboard/profile/settings"
                     className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:bg-muted"
                     onClick={() => setIsUserMenuOpen(false)}
                   >
                     <Cog6ToothIcon className="h-4 w-4" />
                     <span>Settings</span>
                   </Link>
                   <button
                     onClick={() => {
                       setIsUserMenuOpen(false);
                       onLogout();
                     }}
                     className="flex items-center gap-2 w-full px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:bg-muted text-left"
                   >
                     <ArrowRightOnRectangleIcon className="h-4 w-4" />
                     <span>Sign out</span>
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </header>
  );
};

export default ConsoleHeader;