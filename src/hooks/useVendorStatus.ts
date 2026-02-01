import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export function useVendorStatus(userId: string) {
  const { data: vendorProfile, isLoading, error } = useQuery<VendorProfile | null>({
    queryKey: ['vendor-profile', userId],
    queryFn: async () => {
      // Query user_profiles to get user info
      // Note: There's no vendor_profiles or role column in user_profiles yet
      // This is a placeholder until vendor tables are created
      const { error } = await supabase
        .from('user_profiles')
        .select('id, full_name, organization')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }

      // For now, return null since we don't have vendor-specific tables
      // In the future, this would check a vendor_profiles table
      // or a role column on user_profiles
      return null;
    },
    enabled: !!userId,
    retry: false, // Don't retry on 404
  });

  return {
    vendorProfile,
    isVendor: !!vendorProfile,
    isLoading,
    error: error ? error : null,
  };
}
