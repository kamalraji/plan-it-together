import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceServiceDashboard } from './WorkspaceServiceDashboard';
import { WorkspaceListPage } from './WorkspaceListPage';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';

/**
 * WorkspaceService component provides the main routing structure for the Workspace Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page with workspace analytics)
 * - Resource list view (workspaces list)
 * - Resource detail view (workspace details with tabs for tasks, team, communication)
 * - Workspace context switching and navigation
 */
export const WorkspaceService: React.FC = () => {
  return (
    <Routes>
      {/* Service Dashboard - default route */}
      <Route index element={<WorkspaceServiceDashboard />} />
      
      {/* Workspace List Page */}
      <Route path="list" element={<WorkspaceListPage />} />
      
      {/* Workspace Detail with tabs */}
      <Route path=":workspaceId" element={<WorkspaceDetailPage />} />
      <Route path=":workspaceId/tasks" element={<WorkspaceDetailPage defaultTab="tasks" />} />
      <Route path=":workspaceId/team" element={<WorkspaceDetailPage defaultTab="team" />} />
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
