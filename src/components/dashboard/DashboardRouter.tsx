import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ParticipantDashboard } from './ParticipantDashboard';

/**
 * DashboardRouter
 *
 * Chooses which high-level dashboard to render based on the authenticated user's state.
 * For now, all authenticated users land on the ParticipantDashboard, which also
 * surfaces organizer onboarding prompts when relevant.
 */
export const DashboardRouter: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <ParticipantDashboard />;
};

