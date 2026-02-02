import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  isLoading: boolean;
}

/**
 * Hook to check if the current user has completed onboarding
 * Returns loading state while checking, then the onboarding status
 */
export function useOnboardingStatus(): OnboardingStatus {
  const { user, isLoading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('onboarding_completed_at, onboarding_step')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setIsChecking(false);
          return;
        }

        if (data) {
          setIsCompleted(!!data.onboarding_completed_at);
          setCurrentStep(data.onboarding_step ?? 0);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setIsChecking(false);
      }
    }

    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [user, authLoading]);

  return {
    isCompleted,
    currentStep,
    isLoading: authLoading || isChecking,
  };
}
