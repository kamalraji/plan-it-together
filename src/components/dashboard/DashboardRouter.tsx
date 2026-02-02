import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ParticipantDashboard } from './ParticipantDashboard';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';
import { UserRole } from '@/types';
import { ParticipantDashboardSkeleton } from './DashboardSkeleton';

/**
 * DashboardRouter
 *
 * Simplified dashboard router that acts as a fallback for direct /dashboard visits.
 * Most users arrive here already routed by LoginForm's direct navigation.
 * 
 * - Participants: Renders ParticipantDashboard directly
 * - Organizers/Admins: Redirects to their primary org dashboard
 */
export const DashboardRouter: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: primaryOrg, isLoading: orgLoading } = usePrimaryOrganization();

  // Show skeleton while auth or org is resolving
  if (authLoading || orgLoading) {
    return <ParticipantDashboardSkeleton />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Organizers and admins with a primary org go to org-scoped dashboard
  if (
    (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN) &&
    primaryOrg?.slug
  ) {
    return <Navigate to={`/${primaryOrg.slug}/dashboard`} replace />;
  }

  // Organizers without an org - might need onboarding
  if (user.role === UserRole.ORGANIZER && !primaryOrg) {
    return <Navigate to="/onboarding/organization" replace />;
  }

  // Participants and fallback: render participant dashboard directly
  return <ParticipantDashboard />;
};

