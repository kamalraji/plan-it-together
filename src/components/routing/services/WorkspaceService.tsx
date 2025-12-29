import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { WorkspaceServiceDashboard } from './WorkspaceServiceDashboard';
import { WorkspaceListPage } from './WorkspaceListPage';
import { WorkspaceCreatePage } from './WorkspaceCreatePage';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';
import { RequireWorkspaceAccess } from './RequireWorkspaceAccess';

const WorkspaceIndexRoute: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();

  // When under an organization route (/:orgSlug/workspaces), we could render
  // an organization-scoped workspace portal. For now, always show the
  // generic service dashboard.
  if (orgSlug) {
    return <WorkspaceServiceDashboard />;
  }

  return <WorkspaceServiceDashboard />;
};

const WorkspaceAccessRoute: React.FC<{ requireManage?: boolean; children: React.ReactNode }> = ({
  requireManage,
  children,
}) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return (
    <RequireWorkspaceAccess workspaceId={workspaceId} requireManage={requireManage}>
      {children}
    </RequireWorkspaceAccess>
  );
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

      {/* Workspace Detail with tabs (guarded by workspace access) */}
      <Route
        path=":workspaceId"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/tasks"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="tasks" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/team"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="team" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/communication"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="communication" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/analytics"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="analytics" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/reports"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="reports" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/marketplace"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="marketplace" />
          </WorkspaceAccessRoute>
        }
      />
      <Route
        path=":workspaceId/templates"
        element={
          <WorkspaceAccessRoute>
            <WorkspaceDetailPage defaultTab="templates" />
          </WorkspaceAccessRoute>
        }
      />
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/workspaces" replace />} />
    </Routes>
  );
};
