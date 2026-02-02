import { WorkspaceDashboard } from './WorkspaceDashboard';

interface ResponsiveWorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

/**
 * ResponsiveWorkspaceDashboard - Unified responsive layout
 * 
 * Following responsive-first design patterns (Notion, Linear, Slack),
 * we use a single WorkspaceDashboard that adapts to all screen sizes
 * via Tailwind responsive classes and the Sidebar's offcanvas mode.
 */
export function ResponsiveWorkspaceDashboard({ workspaceId, orgSlug }: ResponsiveWorkspaceDashboardProps) {
  return <WorkspaceDashboard workspaceId={workspaceId} orgSlug={orgSlug} />;
}
