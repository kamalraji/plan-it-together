import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VendorDashboardPage } from './VendorDashboardPage';
import { VendorRegistrationPage } from './VendorRegistrationPage';
import { VendorListingPage } from './VendorListingPage';
import { BookingListPage } from './BookingListPage';
import { MarketplacePage } from './MarketplacePage';
import { VendorPage } from './VendorPage';
import { ServiceDetailPage, ServiceDiscoveryEnhanced } from '../../marketplace';

/**
 * MarketplaceService component provides the main routing structure for the Marketplace Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (marketplace analytics and vendor overview)
 * - Service discovery (marketplace service listings with filtering)
 * - Vendor dashboard (vendor management and analytics)
 * - Booking management (booking requests and coordination)
 * - Enhanced marketplace page with integrated components
 * - Comprehensive vendor page with business management
 */
export const MarketplaceService: React.FC = () => {
  return (
    <Routes>
      {/* Enhanced Marketplace Page - default route */}
      <Route index element={<MarketplacePage />} />
      
      {/* Service Discovery - marketplace service listings */}
      <Route path="services" element={<ServiceDiscoveryEnhanced />} />
      <Route path="services/:category" element={<ServiceDiscoveryEnhanced />} />
      <Route path="services/detail/:serviceId" element={<ServiceDetailPage />} />
      
      {/* Vendor Registration and Dashboard */}
      <Route path="vendor/register" element={<VendorRegistrationPage />} />
      <Route path="vendor/browse" element={<VendorListingPage />} />
      <Route path="vendor" element={<VendorPage />} />
      <Route path="vendor/:vendorId" element={<VendorPage />} />
      
      {/* Legacy Vendor Management - keeping for backward compatibility */}
      <Route path="vendors" element={<VendorDashboardPage />} />
      <Route path="vendors/:vendorId" element={<VendorDashboardPage />} />
      
      {/* Booking Management */}
      <Route path="bookings" element={<BookingListPage />} />
      <Route path="bookings/:bookingId" element={<BookingListPage />} />
      
      {/* Vendor Analytics and Performance */}
      <Route path="analytics" element={<VendorDashboardPage defaultTab="analytics" />} />
      <Route path="reviews" element={<VendorDashboardPage defaultTab="reviews" />} />
      
      {/* Redirect unknown routes to marketplace home */}
      <Route path="*" element={<Navigate to="/marketplace" replace />} />
    </Routes>
  );
};

export default MarketplaceService;