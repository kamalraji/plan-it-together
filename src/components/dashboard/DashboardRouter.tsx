import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ParticipantDashboard } from './ParticipantDashboard';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

/**
 * DashboardRouter
 *
 * Chooses which high-level dashboard to render based on the authenticated user's state.
 * For now, all authenticated users land on the ParticipantDashboard, which also
 * surfaces organizer onboarding prompts when relevant.
 *
 * Additionally, new organizers who have not yet completed their organizer
 * onboarding checklist are redirected once to the dedicated onboarding flow.
 */
export const DashboardRouter: React.FC = () => {
  const { user, isLoading, isAuthenticated, refreshUserRoles } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);

  // Refresh roles once when the dashboard mounts so any server-side
  // changes (like new organizer approvals) are reflected in the client.
  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshUserRoles();
  }, [isAuthenticated, refreshUserRoles]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || !user) {
        setCheckingOnboarding(false);
        return;
      }

      if (user.role !== UserRole.ORGANIZER) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('onboarding_checklist')
          .select('completed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('Failed to load organizer onboarding checklist status', error);
          setCheckingOnboarding(false);
          return;
        }

        const isCompleted = !!data?.completed_at;
        setShouldRedirectToOnboarding(!isCompleted);
      } catch (err) {
        console.warn('Unexpected error while checking organizer onboarding status', err);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    void checkOnboarding();
  }, [isAuthenticated, user?.id, user?.role]);

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (shouldRedirectToOnboarding) {
    return <Navigate to="/dashboard/onboarding/organizer" replace />;
  }

  return <ParticipantDashboard />;
};

