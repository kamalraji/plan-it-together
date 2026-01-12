import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import VendorDashboard from '../../vendor/VendorDashboard';
import VendorAnalyticsDashboard from '../../vendor/VendorAnalyticsDashboard';
import ServiceListingManagement from '../../vendor/ServiceListingManagement';
import VendorBookingManagement from '../../vendor/VendorBookingManagement';

interface VendorDashboardPageProps {
  defaultTab?: string;
}

/**
 * VendorDashboardPage provides AWS-style vendor management interface.
 * Features:
 * - Vendor profile management
 * - Service listing management
 * - Booking requests and coordination
 * - Performance analytics and reviews
 * - Tabbed interface for different vendor functions
 */
export const VendorDashboardPage: React.FC<VendorDashboardPageProps> = ({ defaultTab = 'overview' }) => {
  const { vendorId } = useParams<{ vendorId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab || 'overview');

  const pageActions = [
    {
      label: 'Browse Services',
      action: () => navigate('/marketplace/services'),
      icon: MagnifyingGlassIcon,
      variant: 'secondary' as const,
    },
    {
      label: 'View Bookings',
      action: () => navigate('/marketplace/bookings'),
      icon: CalendarIcon,
      variant: 'primary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Vendors', href: '/marketplace/vendors' },
  ];

  if (vendorId) {
    breadcrumbs.push({
      label: `Vendor ${vendorId}`,
      href: `/marketplace/vendors/${vendorId}`,
    });
  }

  const tabs = [
    { id: 'overview', label: 'Overview', component: VendorDashboard },
    { id: 'analytics', label: 'Analytics', component: VendorAnalyticsDashboard },
    { id: 'services', label: 'Services', component: ServiceListingManagement },
    { id: 'bookings', label: 'Bookings', component: VendorBookingManagement },
  ];

  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const Component = activeTabConfig.component as any;
    const userId = user?.id || '';
    const currentVendorId = vendorId || userId;
    
    // Pass appropriate props based on component type
    if (activeTab === 'overview') {
      return <Component userId={userId} />;
    } else if (activeTab === 'analytics') {
      return <Component vendorId={currentVendorId} />;
    } else if (activeTab === 'services') {
      return <Component vendorId={currentVendorId} />;
    } else if (activeTab === 'bookings') {
      return <Component vendorId={currentVendorId} />;
    }
    
    return <Component userId={userId} />;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={vendorId ? `Vendor Dashboard - ${vendorId}` : 'Vendor Dashboard'}
          subtitle="Manage your marketplace presence and track performance"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            current: activeTab === tab.id,
            onClick: () => setActiveTab(tab.id),
          }))}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {renderTabContent()}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Vendor Resources</h3>
          <p className="text-blue-700 mb-4">
            Maximize your success on the marketplace with these resources and best practices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">📈 Performance Tips</h4>
              <p className="text-blue-700">Maintain high ratings by responding quickly and delivering quality service.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">📸 Service Listings</h4>
              <p className="text-blue-700">Use high-quality photos and detailed descriptions to attract more bookings.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">💬 Communication</h4>
              <p className="text-blue-700">Stay responsive to booking requests and maintain professional communication.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};