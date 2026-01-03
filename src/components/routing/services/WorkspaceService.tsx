import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { WorkspaceServiceDashboard } from './WorkspaceServiceDashboard';
import { WorkspaceListPage } from './WorkspaceListPage';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';
import { WorkspaceCreatePage } from './WorkspaceCreatePage';
import { OrgWorkspacePage } from '@/components/organization/OrgWorkspacePage';
import { WorkspaceSettingsPage } from '@/components/workspace/WorkspaceSettingsPage';

/**
 * WorkspaceService component provides the main routing structure for the Workspace Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page with workspace analytics)
 * - Resource list view (workspaces list)
 * - Resource detail view (workspace details with tabs for tasks, team, communication)
 * - Workspace context switching and navigation
 */

const WorkspaceIndexRoute: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();

  // When under an organization route (/:orgSlug/workspaces), render the
  // organization-scoped workspace portal. For global dashboard routes
  // (/dashboard/workspaces) keep using the generic service dashboard.
  if (orgSlug) {
    return <OrgWorkspacePage />;
  }

  return <WorkspaceServiceDashboard />;
};

export const WorkspaceService: React.FC = () => {
  return (
    <Routes>
      {/* Service Dashboard or Org Workspace Page - default route */}
      <Route index element={<WorkspaceIndexRoute />} />

      {/* Workspace List Page */}
      <Route path="list" element={<WorkspaceListPage />} />

      {/* Workspace Create Page */}
      <Route path="create" element={<WorkspaceCreatePage />} />

      {/* Workspace Settings Page */}
      <Route path=":workspaceId/settings" element={<WorkspaceSettingsPage />} />

      {/* Workspace Detail with tabs */}
      <Route path=":workspaceId" element={<WorkspaceDetailPage />} />
      <Route path=":workspaceId/tasks" element={<WorkspaceDetailPage defaultTab="tasks" />} />
      <Route path=":workspaceId/team" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":workspaceId/team/invite" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":workspaceId/communication" element={<WorkspaceDetailPage defaultTab="communication" />} />
      <Route path=":workspaceId/analytics" element={<WorkspaceDetailPage defaultTab="analytics" />} />
      <Route path=":workspaceId/reports" element={<WorkspaceDetailPage defaultTab="reports" />} />
      <Route path=":workspaceId/marketplace" element={<WorkspaceDetailPage defaultTab="marketplace" />} />
      <Route path=":workspaceId/templates" element={<WorkspaceDetailPage defaultTab="templates" />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/workspaces" replace />} />
    </Routes>
  );
};

export default WorkspaceService;
