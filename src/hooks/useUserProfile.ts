import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { USER_PROFILE_COLUMNS } from '@/lib/supabase-columns';

export type UserProfileRow = Tables<'user_profiles'>;

export interface UserProfile extends UserProfileRow {}

interface UseUserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [state, setState] = useState<UseUserProfileState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  const loadProfile = useCallback(async () => {
    if (!user) {
      setState({ profile: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(USER_PROFILE_COLUMNS.detail)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'Unable to load profile.' }));
        return;
      }

      setState({ profile: data ?? null, isLoading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Unable to load profile.' }));
    }
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return { error: 'Not authenticated' } as const;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id)
          .select(USER_PROFILE_COLUMNS.detail)
          .maybeSingle();

        if (error) {
          return { error: 'Unable to update profile' } as const;
        }

        if (data) {
          setState((prev) => ({ ...prev, profile: data }));
        }

        return { error: null } as const;
      } catch {
        return { error: 'Unable to update profile' } as const;
      }
    },
    [user],
  );

  return {
    ...state,
    reload: loadProfile,
    updateProfile,
  };
}
