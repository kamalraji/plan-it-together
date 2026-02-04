import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { UserRole } from '../../types';

interface ServiceNavigationProps {
  user: any;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
  items: ServiceNavigationItem[];
  roles?: UserRole[];
  expanded?: boolean;
}

interface ServiceNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  roles?: UserRole[];
  description?: string;
}

interface NavigationPreferences {
  collapsedCategories: string[];
  favoriteServices: string[];
  recentServices: string[];
  defaultLandingService?: string;
}

// Service navigation configuration with role-based access
const serviceCategories: ServiceCategory[] = [
  {
    id: 'core',
    label: 'Core Services',
    icon: '🏠',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/console/dashboard',
        icon: '📊',
        description: 'Overview and quick access',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN, UserRole.JUDGE, UserRole.VOLUNTEER, UserRole.SPEAKER],
      },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    icon: '⚙️',
    items: [
      {
        id: 'events',
        label: 'Events',
        path: '/console/events',
        icon: '📅',
        description: 'Create and manage events',
        roles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
      },
      {
        id: 'organizations',
        label: 'Organizations',
        path: '/console/organizations',
        icon: '🏢',
        description: 'Manage organizations',
        roles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: '👥',
    items: [
      {
        id: 'workspaces',
        label: 'Workspaces',
        path: '/console/workspaces',
        icon: '💼',
        description: 'Team collaboration',
        roles: [UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: '🛒',
    items: [
      {
        id: 'marketplace',
        label: 'Marketplace',
        path: '/console/marketplace',
        icon: '🛍️',
        description: 'Find and book services',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: '📈',
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/console/analytics',
        icon: '📊',
        description: 'Performance metrics',
        roles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: '💬',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        path: '/console/notifications',
        icon: '🔔',
        description: 'Manage your notifications',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN, UserRole.JUDGE, UserRole.VOLUNTEER, UserRole.SPEAKER],
      },
      {
        id: 'communications',
        label: 'Communications',
        path: '/console/communications',
        icon: '💬',
        description: 'Messages and communication preferences',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN, UserRole.JUDGE, UserRole.VOLUNTEER, UserRole.SPEAKER],
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: '👤',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        path: '/console/profile',
        icon: '👤',
        description: 'Manage your profile',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN, UserRole.JUDGE, UserRole.VOLUNTEER, UserRole.SPEAKER],
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: '❓',
    items: [
      {
        id: 'help',
        label: 'Help & Support',
        path: '/console/support',
        icon: '🆘',
        description: 'Get help and support',
        roles: [UserRole.ORGANIZER, UserRole.PARTICIPANT, UserRole.SUPER_ADMIN, UserRole.JUDGE, UserRole.VOLUNTEER, UserRole.SPEAKER],
      },
    ],
  },
];

export const ServiceNavigation: React.FC<ServiceNavigationProps> = ({
  user,
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for navigation preferences and search
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core', 'management']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [preferences, setPreferences] = useState<NavigationPreferences>({
    collapsedCategories: [],
    favoriteServices: [],
    recentServices: [],
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('navigation-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        setExpandedCategories(prev => 
          prev.filter(cat => !parsed.collapsedCategories.includes(cat))
        );
      } catch (error) {
        console.warn('Failed to parse navigation preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: NavigationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('navigation-preferences', JSON.stringify(newPreferences));
  };

  // Update recent services when navigating
  useEffect(() => {
    const currentService = location.pathname.split('/')[2];
    if (currentService && currentService !== 'dashboard') {
      const newRecentServices = [
        currentService,
        ...preferences.recentServices.filter(s => s !== currentService)
      ].slice(0, 5); // Keep only 5 recent services

      savePreferences({
        ...preferences,
        recentServices: newRecentServices,
      });
    }
  }, [location.pathname]);
  

  // Filter services based on user role
  const filterItemsByRole = (items: ServiceNavigationItem[]) => {
    if (!user?.role) return items;
    return items.filter(item => 
      !item.roles || item.roles.includes(user.role)
    );
  };

  // Get all available services for search
  const allServices = useMemo(() => {
    return serviceCategories.flatMap(category => 
      filterItemsByRole(category.items)
    );
  }, [user?.role]);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return allServices;
    
    const query = searchQuery.toLowerCase();
    return allServices.filter(service =>
      service.label.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query) ||
      service.id.toLowerCase().includes(query)
    );
  }, [allServices, searchQuery]);

  // Get favorite services
  const favoriteServices = useMemo(() => {
    return allServices.filter(service => 
      preferences.favoriteServices.includes(service.id)
    );
  }, [allServices, preferences.favoriteServices]);

  // Get recent services
  const recentServices = useMemo(() => {
    return preferences.recentServices
      .map(serviceId => allServices.find(s => s.id === serviceId))
      .filter(Boolean) as ServiceNavigationItem[];
  }, [allServices, preferences.recentServices]);

  const toggleCategory = (categoryId: string) => {
    if (collapsed && !isMobile) return; // Don't allow expansion when collapsed on desktop
    
    setExpandedCategories(prev => {
      const newExpanded = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Update preferences
      const newCollapsed = serviceCategories
        .map(cat => cat.id)
        .filter(id => !newExpanded.includes(id));
      
      savePreferences({
        ...preferences,
        collapsedCategories: newCollapsed,
      });
      
      return newExpanded;
    });
  };

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = preferences.favoriteServices.includes(serviceId)
      ? preferences.favoriteServices.filter(id => id !== serviceId)
      : [...preferences.favoriteServices, serviceId];
    
    savePreferences({
      ...preferences,
      favoriteServices: newFavorites,
    });
  };

  const isItemActive = (item: ServiceNavigationItem) => {
    return location.pathname.startsWith(item.path);
  };

  const isCategoryActive = (category: ServiceCategory) => {
    return category.items.some(item => isItemActive(item));
  };

  const handleServiceClick = (service: ServiceNavigationItem) => {
    navigate(service.path);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${collapsed && !isMobile ? 'w-16' : 'w-64'}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Services</h2>
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Desktop Header with Search Toggle */}
      {!isMobile && (
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          {(!collapsed || showSearch) && (
            <button
              onClick={toggleSearch}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              title="Search services"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      {(showSearch || isMobile) && (!collapsed || isMobile) && (
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation Content */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Search Results */}
        {searchQuery.trim() && (!collapsed || isMobile) && (
          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Search Results ({filteredServices.length})
            </h3>
            <div className="space-y-1">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isItemActive(service)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {service.icon && <span className="text-base">{service.icon}</span>}
                    <div className="flex-1 text-left">
                      <div className="truncate">{service.label}</div>
                      {service.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(service.id);
                    }}
                    className="ml-2 p-1 rounded hover:bg-gray-200"
                  >
                    {preferences.favoriteServices.includes(service.id) ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </button>
              ))}
              {filteredServices.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No services found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {!searchQuery.trim() && favoriteServices.length > 0 && (!collapsed || isMobile) && (
          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
              <StarIcon className="h-3 w-3 mr-1" />
              Favorites
            </h3>
            <div className="space-y-1">
              {favoriteServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isItemActive(service)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {service.icon && <span className="text-base">{service.icon}</span>}
                    <span className="truncate">{service.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Services Section */}
        {!searchQuery.trim() && recentServices.length > 0 && (!collapsed || isMobile) && (
          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              Recent
            </h3>
            <div className="space-y-1">
              {recentServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isItemActive(service)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {service.icon && <span className="text-base">{service.icon}</span>}
                    <span className="truncate">{service.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Service Categories */}
        {!searchQuery.trim() && (
          <div className="space-y-1 px-3">
            {serviceCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              const isActive = isCategoryActive(category);
              const filteredItems = filterItemsByRole(category.items);

              if (filteredItems.length === 0) return null;

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}
                    disabled={collapsed && !isMobile}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{category.label}</span>
                      )}
                    </div>
                    {(!collapsed || isMobile) && (
                      <ChevronRightIcon
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Category Items */}
                  {(isExpanded || (collapsed && !isMobile)) && (!collapsed || isMobile) && (
                    <div className="mt-1 space-y-1">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="flex items-center">
                          <Link
                            to={item.path}
                            onClick={isMobile ? onCloseMobile : undefined}
                            className={`group flex items-center px-3 py-2 ml-6 text-sm font-medium rounded-md transition-colors flex-1 ${
                              isItemActive(item)
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {item.icon && <span className="text-base">{item.icon}</span>}
                              <div className="flex-1">
                                <div className="truncate">{item.label}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.badge && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className="ml-1 p-1 rounded hover:bg-gray-200"
                            title={preferences.favoriteServices.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {preferences.favoriteServices.includes(item.id) ? (
                              <StarIconSolid className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <StarIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsed Category Items (Desktop Only) */}
                  {collapsed && !isMobile && (
                    <div className="mt-1">
                      {filteredItems.map((item) => (
                        <Link
                          key={item.id}
                          to={item.path}
                          className={`group flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isItemActive(item)
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={item.label}
                        >
                          <span className="text-base">{item.icon || '•'}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Info (when not collapsed) */}
      {(!collapsed || isMobile) && user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-700">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user.name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user.role || 'User'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceNavigation;