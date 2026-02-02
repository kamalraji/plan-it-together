import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizations } from '@/hooks/useOrganization';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAdminSessionTimeout } from '@/hooks/useAdminSessionTimeout';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';

/**
 * AdminLayout
 * 
 * Protected layout wrapper for all admin routes that enforces:
 * 1. User must be authenticated
 * 2. User must have SUPER_ADMIN role (verified client-side)
 * 3. User must be admin in the thittam1hub organization
 * 4. Server-side verification via has_role RPC call
 * 5. Session timeout after 15 minutes of inactivity
 * 
 * This provides defense-in-depth by checking both client-side state
 * and making a server-side verification call to the database.
 */
export const AdminLayout: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();
  const { data: primaryOrg } = usePrimaryOrganization();
  const location = useLocation();
  
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);
  
  const dashboardPath = primaryOrg?.slug ? `/${primaryOrg.slug}/dashboard` : '/dashboard';

  // Session timeout for admin users - 15 minutes of inactivity
  useAdminSessionTimeout({ enabled: isAuthenticated && serverVerified === true });

  // Server-side admin verification via has_role RPC
  useEffect(() => {
    const verifyAdminRole = async () => {
      if (!user?.id) {
        setServerVerified(false);
        setVerifying(false);
        return;
      }

      try {
        // Call the has_role function to verify admin role server-side
        const { data: isAdmin, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) {
          // Server-side verification failed - deny access silently
          setServerVerified(false);
        } else {
          setServerVerified(!!isAdmin);
        }
      } catch (_err) {
        // Unexpected error during verification - deny access
        setServerVerified(false);
      } finally {
        setVerifying(false);
      }
    };

    if (user?.id && !authLoading) {
      verifyAdminRole();
    } else if (!authLoading && !user) {
      setServerVerified(false);
      setVerifying(false);
    }
  }, [user?.id, authLoading]);

  // Show loading state while verifying
  if (authLoading || orgsLoading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral" />
          <p className="text-muted-foreground text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Client-side role check - must be SUPER_ADMIN
  if (user.role !== UserRole.SUPER_ADMIN) {
    // Access denied - insufficient role
    return <Navigate to={dashboardPath} replace />;
  }

  // Server-side role verification failed
  if (serverVerified === false) {
    // Access denied - server verification failed
    return <Navigate to={dashboardPath} replace />;
  }

  // Check if user is admin of the thittam1hub organization
  const isThittamAdmin = myOrganizations?.some((org: any) => org.slug === 'thittam1hub');
  if (!isThittamAdmin) {
    // Access denied - not a member of thittam1hub org
    return <Navigate to={dashboardPath} replace />;
  }

  // All checks passed - render admin content
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
