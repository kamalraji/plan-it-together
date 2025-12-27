import { useQuery } from '@tanstack/react-query';
import { checkApiHealth } from '@/lib/api';

export const useApiHealth = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      return checkApiHealth();
    },
    retry: 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    isHealthy: data ?? true,
    isChecking: isLoading,
    hasError: isError,
  };
};
