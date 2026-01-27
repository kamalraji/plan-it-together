import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ConsoleHeader } from './ConsoleHeader';
import { ServiceNavigation } from './ServiceNavigation';
import { BreadcrumbBar } from './BreadcrumbBar';
import { useAuth } from '../../hooks/useAuth';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.2,
};

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
  const { user, logout } = useAuth();
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleServiceChange = (service: string) => {
    console.log('Service changed to:', service);
  };

  const handleSearch = (query: string) => {
    console.log('Global search:', query);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleNavigation = () => {
    setIsNavigationCollapsed(!isNavigationCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Console Header */}
      <ConsoleHeader
        user={user}
        onServiceChange={handleServiceChange}
        onSearch={handleSearch}
        onLogout={handleLogout}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="flex mt-14 sm:mt-16">
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
                  className="fixed inset-0 bg-black/60"
                  onClick={toggleMobileMenu}
                />
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card">
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

          {/* Page Content with Animation */}
          <main className="flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className="py-6"
              >
                {children || <Outlet />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ConsoleLayout;