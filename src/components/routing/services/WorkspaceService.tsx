import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { WorkspaceServiceDashboard } from './WorkspaceServiceDashboard';
import { WorkspaceListPage } from './WorkspaceListPage';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';
import { WorkspaceCreatePage } from './WorkspaceCreatePage';
import { OrgWorkspacePage } from '@/components/organization/OrgWorkspacePage';
import { OrgWorkspaceListPage } from '@/components/organization/OrgWorkspaceListPage';
import { WorkspaceSettingsPage } from '@/components/workspace/WorkspaceSettingsPage';
import { LegacyWorkspaceRedirect } from '@/components/workspace/LegacyWorkspaceRedirect';

/**
 * WorkspaceService component provides the main routing structure for the Workspace Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page with workspace analytics)
 * - Resource list view (workspaces list)
 * - Resource detail view (workspace details with tabs for tasks, team, communication)
 * - Workspace context switching and navigation
 * 
 * NEW Hierarchical Routes (Option A):
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug/team/:teamSlug
 * 
 * LEGACY Routes (redirect to new format):
 * - /:orgSlug/workspaces/:eventId/root?workspaceId=xxx
 * - /:orgSlug/workspaces/:eventId/department?name=xxx&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventId/committee?name=xxx&workspaceId=xxx
 */

/**
 * Helper to detect if a path segment looks like a UUID (legacy format)
 */
const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const WorkspaceIndexRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const location = useLocation();
  
  // Check if we're in an org context by looking at the URL path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isOrgContext = pathParts.length >= 1 && pathParts[0] !== 'dashboard' && pathParts[0] !== 'console';

  // When under an organization route with eventId (/:orgSlug/workspaces/:eventId), 
  // check if it's a legacy UUID format and redirect to new hierarchical format
  if (isOrgContext && eventId) {
    // If eventId is a UUID, this is a legacy URL - redirect it
    if (isUUID(eventId)) {
      return <LegacyWorkspaceRedirect />;
    }
    return <OrgWorkspacePage />;
  }

  // When under an organization route without eventId (/:orgSlug/workspaces),
  // show the organization workspace list grouped by ownership.
  if (isOrgContext) {
    return <OrgWorkspaceListPage />;
  }

  // For global dashboard routes (/dashboard/workspaces) use the generic service dashboard.
  return <WorkspaceServiceDashboard />;
};

/**
 * Wrapper component that detects legacy vs new URL format
 * and renders appropriate component
 */
const HierarchicalOrLegacyRoute: React.FC = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  
  // If eventSlug is a UUID, it's a legacy URL - redirect
  if (eventSlug && isUUID(eventSlug)) {
    return <LegacyWorkspaceRedirect />;
  }
  
  // New hierarchical format
  return <OrgWorkspacePage />;
};

export const WorkspaceService: React.FC = () => {
  return (
    <Routes>
      {/* Index route - determines which view to show based on context */}
      <Route index element={<WorkspaceIndexRoute />} />

      {/* Workspace List Page - for dashboard */}
      <Route path="list" element={<WorkspaceListPage />} />

      {/* Workspace Create Page - works for both /:orgSlug/workspaces/create and /dashboard/workspaces/create */}
      <Route path="create" element={<WorkspaceCreatePage />} />
      
      {/* Workspace Create with event pre-selected - /:orgSlug/workspaces/create/:eventId */}
      <Route path="create/:eventId" element={<WorkspaceCreatePage />} />

      {/* ============================================
          NEW: Hierarchical URL Routes (Option A)
          Pattern: /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug
          ============================================ */}
      
      {/* L1 Root: /:orgSlug/workspaces/:eventSlug/root/:rootSlug */}
      <Route path=":eventSlug/root/:rootSlug" element={<HierarchicalOrLegacyRoute />} />
      <Route path=":eventSlug/root/:rootSlug/settings" element={<WorkspaceSettingsPage />} />
      
      {/* L2 Department: .../root/:rootSlug/department/:deptSlug */}
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug" element={<HierarchicalOrLegacyRoute />} />
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug/settings" element={<WorkspaceSettingsPage />} />
      
      {/* L3 Committee: .../department/:deptSlug/committee/:committeeSlug */}
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug" element={<HierarchicalOrLegacyRoute />} />
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug/settings" element={<WorkspaceSettingsPage />} />
      
      {/* L4 Team: .../committee/:committeeSlug/team/:teamSlug */}
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug/team/:teamSlug" element={<HierarchicalOrLegacyRoute />} />
      <Route path=":eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug/team/:teamSlug/settings" element={<WorkspaceSettingsPage />} />

      {/* ============================================
          LEGACY: ID-based workspace routes (backward compatibility)
          These redirect to new hierarchical format
          ============================================ */}
      
      {/* Legacy type-based routes - redirect to new format */}
      <Route path=":eventId/root" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/department" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/department/settings" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/committee" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/committee/settings" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/team" element={<LegacyWorkspaceRedirect />} />
      <Route path=":eventId/team/settings" element={<LegacyWorkspaceRedirect />} />

      {/* Event-specific workspace portal (legacy eventId format) */}
      <Route path=":eventId" element={<WorkspaceIndexRoute />} />
      
      {/* Legacy workspace settings */}
      <Route path=":eventId/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

      {/* Legacy workspace detail with tabs */}
      <Route path=":eventId/:workspaceId/tasks" element={<WorkspaceDetailPage defaultTab="tasks" />} />
      <Route path=":eventId/:workspaceId/team" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/team/invite" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/communication" element={<WorkspaceDetailPage defaultTab="communication" />} />
      <Route path=":eventId/:workspaceId/analytics" element={<WorkspaceDetailPage defaultTab="analytics" />} />
      <Route path=":eventId/:workspaceId/reports" element={<WorkspaceDetailPage defaultTab="reports" />} />
      <Route path=":eventId/:workspaceId/marketplace" element={<WorkspaceDetailPage defaultTab="marketplace" />} />
      <Route path=":eventId/:workspaceId/templates" element={<WorkspaceDetailPage defaultTab="templates" />} />
      
      {/* General workspace detail - MUST come after more specific routes */}
      <Route path=":eventId/:workspaceId" element={<WorkspaceDetailPage />} />

      {/* Legacy routes without eventId - redirect to dashboard */}
      <Route path=":workspaceId/settings" element={<WorkspaceSettingsPage />} />
      <Route path=":workspaceId" element={<WorkspaceDetailPage />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/workspaces" replace />} />
    </Routes>
  );
};

export default WorkspaceService;
