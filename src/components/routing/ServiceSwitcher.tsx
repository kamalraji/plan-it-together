import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDownIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export interface ServiceDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  path: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  order: number;
}

interface ServiceSwitcherProps {
  services: ServiceDefinition[];
  currentService?: string;
  onServiceChange: (service: string) => void;
  recentServices?: string[];
  favoriteServices?: string[];
  onToggleFavorite?: (serviceId: string) => void;
}

export const ServiceSwitcher: React.FC<ServiceSwitcherProps> = ({
  services,
  currentService,
  onServiceChange,
  recentServices = [],
  favoriteServices = [],
  onToggleFavorite,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current service from URL if not provided
  const activeService = currentService || location.pathname.split('/')[2] || 'dashboard';
  const currentServiceData = services.find(s => s.id === activeService);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter services based on search query
  const filteredServices = services.filter(service =>
    service.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceDefinition[]>);

  // Get favorite and recent services
  const favoriteServicesList = services.filter(s => favoriteServices.includes(s.id));
  const recentServicesList = services.filter(s => recentServices.includes(s.id));

  const handleServiceSelect = (serviceId: string) => {
    setIsOpen(false);
    setSearchQuery('');
    onServiceChange(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      navigate(service.path);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(serviceId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        aria-label="Service switcher"
        aria-expanded={isOpen}
      >
        <span className="hidden sm:block">
          {currentServiceData?.displayName || 'Dashboard'}
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Service Switcher Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4">
            {/* Search Input */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            {/* Favorites Section */}
            {!searchQuery && favoriteServicesList.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Favorites
                </h3>
                <div className="space-y-1">
                  {favoriteServicesList.map((service) => (
                    <ServiceItem
                      key={service.id}
                      service={service}
                      isActive={service.id === activeService}
                      isFavorite={true}
                      onSelect={handleServiceSelect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Services Section */}
            {!searchQuery && recentServicesList.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recent
                </h3>
                <div className="space-y-1">
                  {recentServicesList.map((service) => (
                    <ServiceItem
                      key={service.id}
                      service={service}
                      isActive={service.id === activeService}
                      isFavorite={favoriteServices.includes(service.id)}
                      onSelect={handleServiceSelect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Services by Category */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {searchQuery ? 'Search Results' : 'All Services'}
              </h3>
              {Object.keys(servicesByCategory).length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No services found matching "{searchQuery}"
                </div>
              ) : (
                Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} className="mb-3">
                    {!searchQuery && (
                      <h4 className="text-xs font-medium text-gray-700 mb-1 px-2">{category}</h4>
                    )}
                    <div className="space-y-1">
                      {categoryServices.map((service) => (
                        <ServiceItem
                          key={service.id}
                          service={service}
                          isActive={service.id === activeService}
                          isFavorite={favoriteServices.includes(service.id)}
                          onSelect={handleServiceSelect}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ServiceItemProps {
  service: ServiceDefinition;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (serviceId: string) => void;
  onToggleFavorite: (e: React.MouseEvent, serviceId: string) => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <button
      onClick={() => onSelect(service.id)}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md text-left hover:bg-gray-50 transition-colors group ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{service.displayName}</div>
        <div className="text-xs text-gray-500 truncate">{service.description}</div>
      </div>
      <button
        onClick={(e) => onToggleFavorite(e, service.id)}
        className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? (
          <StarIconSolid className="h-4 w-4 text-yellow-500" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
        )}
      </button>
    </button>
  );
};

export default ServiceSwitcher;
