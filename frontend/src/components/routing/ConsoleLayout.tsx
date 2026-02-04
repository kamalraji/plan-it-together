import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConsoleHeader } from './ConsoleHeader';
import { ServiceNavigation } from './ServiceNavigation';
import { BreadcrumbBar } from './BreadcrumbBar';
import { useAuth } from '../../hooks/useAuth';

interface ConsoleLayoutProps {
  children?: React.ReactNode;
  showServiceNavigation?: boolean;
  showBreadcrumbs?: boolean;
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({
  children,
  showServiceNavigation = true,
  showBreadcrumbs = true,
}) => {
  const { user } = useAuth();
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get current service from URL (for future use)
  // const currentService = 'dashboard';

  const handleServiceChange = (service: string) => {
    // This will be handled by React Router navigation
    console.log('Service changed to:', service);
  };

  const handleSearch = (query: string) => {
    // Global search functionality
    console.log('Global search:', query);
  };

  const handleLogout = () => {
    // Logout functionality - will be implemented with auth integration
    console.log('Logout requested');
  };

  const toggleNavigation = () => {
    setIsNavigationCollapsed(!isNavigationCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Console Header */}
      <ConsoleHeader
        user={user}
        onServiceChange={handleServiceChange}
        onSearch={handleSearch}
        onLogout={handleLogout}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="flex">
        {/* Service Navigation Sidebar */}
        {showServiceNavigation && (
          <>
            {/* Desktop Navigation */}
            <div
              className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 lg:z-40 transition-all duration-300 ${
                isNavigationCollapsed ? 'lg:w-16' : 'lg:w-64'
              }`}
            >
              <ServiceNavigation
                user={user}
                collapsed={isNavigationCollapsed}
                onToggleCollapse={toggleNavigation}
              />
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div
                  className="fixed inset-0 bg-gray-600 bg-opacity-75"
                  onClick={toggleMobileMenu}
                />
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                  <ServiceNavigation
                    user={user}
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    isMobile={true}
                    onCloseMobile={toggleMobileMenu}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            showServiceNavigation
              ? isNavigationCollapsed
                ? 'lg:ml-16'
                : 'lg:ml-64'
              : ''
          }`}
        >
          {/* Breadcrumb Bar */}
          {showBreadcrumbs && (
            <BreadcrumbBar />
          )}

          {/* Page Content */}
          <main className="flex-1">
            <div className="py-6">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ConsoleLayout;