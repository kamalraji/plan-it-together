import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEventAccess } from '@/hooks/useEventAccess';

interface RequireEventAccessProps {
  eventId?: string;
  requireManage?: boolean;
  children: React.ReactNode;
}

export const RequireEventAccess: React.FC<RequireEventAccessProps> = ({
  eventId,
  requireManage = false,
  children,
}) => {
  const { canView, canManage, isLoading, error } = useEventAccess(eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !canView || (requireManage && !canManage)) {
    return <Navigate to="/console/events/list" replace />;
  }

  return <>{children}</>;
};
