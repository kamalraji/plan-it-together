import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MarketplaceServiceDashboard } from './MarketplaceServiceDashboard';
import { MarketplaceListPage } from './MarketplaceListPage';
import { VendorDashboardPage } from './VendorDashboardPage';
import { BookingListPage } from './BookingListPage';
import { MarketplacePage } from './MarketplacePage';
import { VendorPage } from './VendorPage';

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
      {/* Service Dashboard - default route */}
      <Route index element={<MarketplaceServiceDashboard />} />
      
      {/* Enhanced Marketplace Page - comprehensive marketplace interface */}
      <Route path="marketplace" element={<MarketplacePage />} />
      
      {/* Service Discovery - marketplace service listings */}
      <Route path="services" element={<MarketplaceListPage />} />
      <Route path="services/:category" element={<MarketplaceListPage />} />
      
      {/* Enhanced Vendor Page - comprehensive vendor management */}
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
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/marketplace" replace />} />
    </Routes>
  );
};

export default MarketplaceService;