import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { ParticipantDashboard } from './ParticipantDashboard';
import { useMyOrganizations } from '@/hooks/useOrganization';

/**
 * DashboardRouter
 *
 * Chooses which high-level dashboard to render based on the authenticated user's role.
 * - ORGANIZER / SUPER_ADMIN -> Redirect into org-scoped dashboard
 * - Everyone else -> ParticipantDashboard
 */
export const DashboardRouter: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();

  const isOrganizer = user?.role === UserRole.ORGANIZER || user?.role === UserRole.SUPER_ADMIN;

  if (isLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isOrganizer) {
    if (!myOrganizations || myOrganizations.length === 0) {
      // Organizer without an organization yet: send to detailed organization registration
      return <Navigate to="/onboarding/organization" replace />;
    }

    const primaryOrg = myOrganizations[0];
    return <Navigate to={`/${primaryOrg.slug}/dashboard`} replace />;
  }

  return <ParticipantDashboard />;
};
