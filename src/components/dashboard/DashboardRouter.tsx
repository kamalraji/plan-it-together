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
  const [rolesRefreshed, setRolesRefreshed] = useState(false);
 
  // Refresh roles once when the dashboard mounts so any server-side
  // changes (like new organizer approvals) are reflected in the client.
  useEffect(() => {
    if (!isAuthenticated) return;
    console.log('[DashboardRouter] Refreshing user roles on mount. Current user:', {
      id: user?.id,
      role: user?.role,
      isAuthenticated,
    });
    void refreshUserRoles().then(() => {
      console.log('[DashboardRouter] Finished refreshing user roles. Updated user:', {
        id: user?.id,
        role: user?.role,
      });
      setRolesRefreshed(true);
    });
  }, [isAuthenticated, refreshUserRoles, user?.id]);
 
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || !user) {
        console.log('[DashboardRouter] Skipping onboarding check: not authenticated or no user', {
          isAuthenticated,
          hasUser: !!user,
        });
        setCheckingOnboarding(false);
        return;
      }
 
      if (!rolesRefreshed) {
        console.log('[DashboardRouter] Waiting for roles to be refreshed before onboarding check', {
          id: user.id,
          role: user.role,
        });
        return;
      }
 
      console.log('[DashboardRouter] Running onboarding check for user:', {
        id: user.id,
        role: user.role,
      });
 
      if (user.role !== UserRole.ORGANIZER) {
        console.log('[DashboardRouter] User is not an organizer, skipping organizer onboarding redirect.', {
          id: user.id,
          role: user.role,
        });
        setCheckingOnboarding(false);
        return;
      }
 
      try {
        const { data, error } = await supabase
          .from('onboarding_checklist')
          .select('completed_at')
          .eq('user_id', user.id)
          .maybeSingle();
 
        console.log('[DashboardRouter] Onboarding checklist query result:', {
          userId: user.id,
          data,
          error,
        });
 
        if (error) {
          console.warn('Failed to load organizer onboarding checklist status', error);
          setCheckingOnboarding(false);
          return;
        }
 
        const isCompleted = !!data?.completed_at;
        console.log('[DashboardRouter] Computed onboarding status:', {
          userId: user.id,
          isCompleted,
        });
        setShouldRedirectToOnboarding(!isCompleted);
      } catch (err) {
        console.warn('Unexpected error while checking organizer onboarding status', err);
      } finally {
        setCheckingOnboarding(false);
      }
    };
 
    void checkOnboarding();
  }, [isAuthenticated, rolesRefreshed, user?.id]);

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

  // Route based on user role
  if (user.role === UserRole.SUPER_ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === UserRole.ORGANIZER) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  return <ParticipantDashboard />;
};

