import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';

interface RequireWorkspaceAccessProps {
  workspaceId?: string;
  requireManage?: boolean;
  children: React.ReactNode;
}

export const RequireWorkspaceAccess: React.FC<RequireWorkspaceAccessProps> = ({
  workspaceId,
  requireManage = false,
  children,
}) => {
  const { canView, canManage, isLoading, error } = useWorkspaceAccess(workspaceId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !canView || (requireManage && !canManage)) {
    return <Navigate to="/console/workspaces" replace />;
  }

  return <>{children}</>;
};
