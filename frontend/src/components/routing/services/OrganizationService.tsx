import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrganizationServiceDashboard } from './OrganizationServiceDashboard';
import { OrganizationListPage } from './OrganizationListPage';
import { OrganizationDetailPage } from './OrganizationDetailPage';
import { OrganizationMembersPage } from './OrganizationMembersPage';
import { OrganizationSettingsPage } from './OrganizationSettingsPage';
import { OrganizationAnalyticsPage } from './OrganizationAnalyticsPage';

/**
 * OrganizationService component provides the main routing structure for the Organization Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page)
 * - Organization list view (organizations list)
 * - Organization detail view (organization details)
 * - Member management (organization members)
 * - Settings management (organization settings)
 * - Analytics dashboard (organization analytics)
 */
export const OrganizationService: React.FC = () => {
  return (
    <Routes>
      {/* Service Dashboard - default route */}
      <Route index element={<OrganizationServiceDashboard />} />
      
      {/* Organization List Page */}
      <Route path="list" element={<OrganizationListPage />} />
      
      {/* Organization Detail and Management */}
      <Route path=":organizationId" element={<OrganizationDetailPage />} />
      <Route path=":organizationId/members" element={<OrganizationMembersPage />} />
      <Route path=":organizationId/settings" element={<OrganizationSettingsPage />} />
      <Route path=":organizationId/analytics" element={<OrganizationAnalyticsPage />} />
      
      {/* Multi-organization management */}
      <Route path="multi-org" element={<OrganizationListPage filterBy="managed" />} />
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/organizations" replace />} />
    </Routes>
  );
};

export default OrganizationService;