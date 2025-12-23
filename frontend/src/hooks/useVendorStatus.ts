import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export function useVendorStatus(userId: string) {
  const { data: vendorProfile, isLoading, error } = useQuery({
    queryKey: ['vendor-profile', userId],
    queryFn: async () => {
      try {
        const response = await api.get(`/vendors/profile/${userId}`);
        return response.data.data as VendorProfile;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // User doesn't have a vendor profile
          return null;
        }
        throw err;
      }
    },
    enabled: !!userId,
    retry: false, // Don't retry on 404
  });

  return {
    vendorProfile,
    isVendor: !!vendorProfile,
    isLoading,
    error: error && (error as any).response?.status !== 404 ? error : null,
  };
}