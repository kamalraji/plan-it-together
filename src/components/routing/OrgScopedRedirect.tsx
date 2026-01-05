import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

interface OrgScopedRedirectProps {
  /** The service path to redirect to (e.g., 'eventmanagement', 'workspaces') */
  servicePath: string;
  /** Fallback path if no organization is found */
  fallbackPath?: string;
}

/**
 * OrgScopedRedirect
 * 
 * Redirects organizer/admin users from /dashboard/* routes to their
 * primary organization's equivalent route (/:orgSlug/*).
 * 
 * For participants or users without an organization, renders the fallback.
 */
export const OrgScopedRedirect: React.FC<OrgScopedRedirectProps> = ({
  servicePath,
  fallbackPath = '/dashboard',
}) => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [primaryOrgSlug, setPrimaryOrgSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOrganizerOrAdmin = user?.role === UserRole.ORGANIZER || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    const fetchPrimaryOrg = async () => {
      if (!isAuthenticated || !user || !isOrganizerOrAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organization_memberships')
          .select('organization_id, organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('[OrgScopedRedirect] Failed to fetch primary org:', error);
        } else if (data?.organizations) {
          const org = data.organizations as { slug: string };
          setPrimaryOrgSlug(org.slug);
        }
      } catch (err) {
        console.warn('[OrgScopedRedirect] Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPrimaryOrg();
  }, [isAuthenticated, user?.id, isOrganizerOrAdmin]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // If user has an organization, redirect to org-scoped route
  if (primaryOrgSlug && isOrganizerOrAdmin) {
    // Preserve any sub-paths after the service path
    const currentSubPath = location.pathname.replace(/^\/dashboard\/[^/]+/, '');
    const targetPath = `/${primaryOrgSlug}/${servicePath}${currentSubPath}`;
    return <Navigate to={targetPath} replace />;
  }

  // For participants or users without orgs, go to fallback
  return <Navigate to={fallbackPath} replace />;
};

export default OrgScopedRedirect;
