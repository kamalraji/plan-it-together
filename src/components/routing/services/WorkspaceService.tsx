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
 * 
 * Routes:
 * - /:orgSlug/workspaces/:eventId - Event-specific workspace portal
 * - /:orgSlug/workspaces/:eventId/:workspaceId/* - Workspace detail views
 */

const WorkspaceIndexRoute: React.FC = () => {
  const { orgSlug, eventId } = useParams<{ orgSlug?: string; eventId?: string }>();

  // When under an organization route with eventId (/:orgSlug/workspaces/:eventId), 
  // render the organization-scoped workspace portal for that event.
  // For global dashboard routes (/dashboard/workspaces) keep using the generic service dashboard.
  if (orgSlug && eventId) {
    return <OrgWorkspacePage />;
  }

  return <WorkspaceServiceDashboard />;
};

export const WorkspaceService: React.FC = () => {
  return (
    <Routes>
      {/* Global dashboard route - /dashboard/workspaces */}
      <Route index element={<WorkspaceServiceDashboard />} />

      {/* Workspace List Page - for dashboard */}
      <Route path="list" element={<WorkspaceListPage />} />

      {/* Workspace Create Page - for dashboard */}
      <Route path="create" element={<WorkspaceCreatePage />} />

      {/* Event-specific workspace portal - /:orgSlug/workspaces/:eventId */}
      <Route path=":eventId" element={<WorkspaceIndexRoute />} />

      {/* Workspace Settings Page under event context */}
      <Route path=":eventId/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

      {/* Workspace Detail with tabs under event context */}
      <Route path=":eventId/:workspaceId" element={<WorkspaceDetailPage />} />
      <Route path=":eventId/:workspaceId/tasks" element={<WorkspaceDetailPage defaultTab="tasks" />} />
      <Route path=":eventId/:workspaceId/team" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/team/invite" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/communication" element={<WorkspaceDetailPage defaultTab="communication" />} />
      <Route path=":eventId/:workspaceId/analytics" element={<WorkspaceDetailPage defaultTab="analytics" />} />
      <Route path=":eventId/:workspaceId/reports" element={<WorkspaceDetailPage defaultTab="reports" />} />
      <Route path=":eventId/:workspaceId/marketplace" element={<WorkspaceDetailPage defaultTab="marketplace" />} />
      <Route path=":eventId/:workspaceId/templates" element={<WorkspaceDetailPage defaultTab="templates" />} />

      {/* Legacy routes without eventId - redirect to dashboard */}
      <Route path=":workspaceId/settings" element={<WorkspaceSettingsPage />} />
      <Route path=":workspaceId" element={<WorkspaceDetailPage />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/workspaces" replace />} />
    </Routes>
  );
};

export default WorkspaceService;
