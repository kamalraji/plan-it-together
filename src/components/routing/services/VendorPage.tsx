import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import VendorDashboard from '../../vendor/VendorDashboard';

/**
 * VendorPage provides the vendor management interface using the refactored VendorDashboard.
 * Features real Supabase data for:
 * - Vendor profile and business management
 * - Service listing creation and management
 * - Customer reviews tracking and responses
 */
export const VendorPage: React.FC = () => {
  const { user } = useAuth();

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Vendor Dashboard', href: '/marketplace/vendor' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Vendor Dashboard"
          subtitle="Manage your marketplace presence, services, and customer reviews"
          breadcrumbs={breadcrumbs}
        />

        <div className="mt-6">
          <VendorDashboard userId={user?.id} />
        </div>
      </div>
    </div>
  );
};

export default VendorPage;