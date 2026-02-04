import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import ServiceDiscoveryUI from '../../marketplace/ServiceDiscoveryUI';

/**
 * MarketplaceListPage provides AWS-style service discovery interface for the marketplace.
 * Features:
 * - Service discovery with filtering and search
 * - Category-based browsing
 * - Integration with existing ServiceDiscoveryUI component
 * - AWS-style page layout with consistent header and actions
 */
export const MarketplaceListPage: React.FC = () => {
  const { category } = useParams<{ category?: string }>();

  const pageActions = [
    {
      label: 'Manage Bookings',
      action: () => { window.location.href = '/console/marketplace/bookings'; },
      variant: 'primary' as const,
    },
    {
      label: 'Vendor Dashboard',
      action: () => { window.location.href = '/console/marketplace/vendors'; },
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Marketplace', href: '/console/marketplace' },
    { label: 'Services', href: '/console/marketplace/services' },
  ];

  if (category) {
    breadcrumbs.push({
      label: category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      href: `/console/marketplace/services/${category}`,
    });
  }

  const getPageTitle = () => {
    if (category) {
      return `${category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Services`;
    }
    return 'Marketplace Services';
  };

  const getPageSubtitle = () => {
    if (category) {
      return `Browse ${category.replace('_', ' ').toLowerCase()} services from verified vendors`;
    }
    return 'Discover and book services from verified vendors for your events';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />

        {/* Service Categories Quick Navigation */}
        {!category && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { id: 'VENUE', name: 'Venues', icon: '🏢' },
                { id: 'CATERING', name: 'Catering', icon: '🍽️' },
                { id: 'PHOTOGRAPHY', name: 'Photography', icon: '📸' },
                { id: 'VIDEOGRAPHY', name: 'Videography', icon: '🎥' },
                { id: 'ENTERTAINMENT', name: 'Entertainment', icon: '🎭' },
                { id: 'DECORATION', name: 'Decoration', icon: '🎨' },
                { id: 'AUDIO_VISUAL', name: 'Audio/Visual', icon: '🔊' },
                { id: 'TRANSPORTATION', name: 'Transport', icon: '🚐' },
                { id: 'SECURITY', name: 'Security', icon: '🛡️' },
                { id: 'CLEANING', name: 'Cleaning', icon: '🧹' },
                { id: 'EQUIPMENT_RENTAL', name: 'Equipment', icon: '⚙️' },
                { id: 'PRINTING', name: 'Printing', icon: '🖨️' },
                { id: 'MARKETING', name: 'Marketing', icon: '📢' },
                { id: 'OTHER', name: 'Other', icon: '📦' },
              ].map((cat) => (
                <a
                  key={cat.id}
                  href={`/console/marketplace/services/${cat.id}`}
                  className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <span className="text-2xl mb-2">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-900 text-center">{cat.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Service Discovery Interface */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ServiceDiscoveryUI />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help Finding Services?</h3>
          <p className="text-gray-600 mb-4">
            Our marketplace features verified vendors with transparent pricing and customer reviews. 
            Use filters to narrow down options by location, budget, and specific requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🔍 Smart Search</h4>
              <p className="text-gray-600">Use keywords to find specific services or browse by category.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">⭐ Verified Vendors</h4>
              <p className="text-gray-600">All vendors are verified with ratings and reviews from other organizers.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">💬 Direct Communication</h4>
              <p className="text-gray-600">Request quotes and communicate directly with vendors through our platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceListPage;