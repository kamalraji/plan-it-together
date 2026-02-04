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

  // Get current service from URL
  const currentService = location.pathname.split('/')[2] || 'dashboard';

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
    navigate(`/console/${serviceId}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/console" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T1</span>
            </div>
            <span className="hidden sm:block text-xl font-semibold text-gray-900">
              Thittam1Hub
            </span>
          </Link>

          {/* Service Switcher */}
          <div className="relative" ref={serviceSwitcherRef}>
            <button
              onClick={() => setIsServiceSwitcherOpen(!isServiceSwitcherOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="text-lg">{currentServiceData?.icon || '🏠'}</span>
              <span className="hidden sm:block">{currentServiceData?.displayName || 'Dashboard'}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {/* Service Switcher Dropdown */}
            {isServiceSwitcherOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Switch Service</h3>
                  <div className="space-y-1">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md text-left hover:bg-gray-50 ${
                          service.id === currentService ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{service.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{service.displayName}</div>
                          <div className="text-xs text-gray-500">{service.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Global Search */}
        <div className="flex-1 max-w-lg mx-4">
          <GlobalSearch 
            onSearch={onSearch}
            placeholder="Search services, resources..."
            showShortcuts={true}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notification Center */}
          <NotificationCenter />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <span className="hidden sm:block">{user?.name || 'User'}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                  <div className="text-sm text-gray-500">{user?.email || 'user@example.com'}</div>
                  <div className="text-xs text-gray-400 mt-1">{user?.role || 'User'}</div>
                </div>
                <div className="py-1">
                  <Link
                    to="/console/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/console/profile/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
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