import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

// Zod schemas for validation
export const roleSchema = z.enum(['participant', 'organizer']);
export type SelectedRole = z.infer<typeof roleSchema>;

export const basicProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Only letters, numbers, and underscores'),
  avatarUrl: z.string().optional(),
});

export const participantAboutSchema = z.object({
  organization: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  skills: z.array(z.string()).default([]),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
});

export const organizerAboutSchema = z.object({
  organization: z.string().min(2, 'Organization name is required'),
  jobTitle: z.string().optional(),
  organizationType: z.enum(['college', 'company', 'nonprofit', 'community', 'other']).optional(),
});

export const connectivitySchema = z.object({
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
});

export const participantPreferencesSchema = z.object({
  eventInterests: z.array(z.string()).default([]),
  lookingFor: z.array(z.string()).default([]),
  notificationFrequency: z.enum(['daily', 'weekly', 'monthly', 'never']).default('weekly'),
});

export const organizerPreferencesSchema = z.object({
  expectedEventTypes: z.array(z.string()).default([]),
  teamSize: z.enum(['solo', 'small', 'medium', 'large']).optional(),
});

export interface OnboardingData {
  role: SelectedRole | null;
  basicProfile: z.infer<typeof basicProfileSchema> | null;
  participantAbout: z.infer<typeof participantAboutSchema> | null;
  organizerAbout: z.infer<typeof organizerAboutSchema> | null;
  connectivity: z.infer<typeof connectivitySchema> | null;
  participantPreferences: z.infer<typeof participantPreferencesSchema> | null;
  organizerPreferences: z.infer<typeof organizerPreferencesSchema> | null;
}

const STORAGE_KEY = 'onboarding_progress';
const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredProgress {
  data: OnboardingData;
  step: number;
  timestamp: number;
}

const initialData: OnboardingData = {
  role: null,
  basicProfile: null,
  participantAbout: null,
  organizerAbout: null,
  connectivity: null,
  participantPreferences: null,
  organizerPreferences: null,
};

export function useOnboardingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Total steps based on role
  const totalSteps = data.role ? 5 : 1;

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredProgress = JSON.parse(stored);
        const now = Date.now();
        
        // Check if progress is still valid (within 24 hours)
        if (now - parsed.timestamp < STORAGE_EXPIRY_MS) {
          setData(parsed.data);
          setCurrentStep(parsed.step);
        } else {
          // Clear expired progress
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore parsing errors
    }
    setIsInitialized(true);
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((newData: OnboardingData, step: number) => {
    try {
      const progress: StoredProgress = {
        data: newData,
        step,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const updateData = useCallback(<K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setData(prev => {
      const newData = { ...prev, [key]: value };
      saveProgress(newData, currentStep);
      return newData;
    });
  }, [currentStep, saveProgress]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, totalSteps - 1);
      saveProgress(data, next);
      return next;
    });
  }, [data, totalSteps, saveProgress]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 0);
      saveProgress(data, next);
      return next;
    });
  }, [data, saveProgress]);

  const goToStep = useCallback((step: number) => {
    const next = Math.max(0, Math.min(step, totalSteps - 1));
    saveProgress(data, next);
    setCurrentStep(next);
  }, [data, totalSteps, saveProgress]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialData);
    setCurrentStep(0);
  }, []);

  return {
    currentStep,
    totalSteps,
    data,
    isInitialized,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    clearProgress,
    setCurrentStep,
  };
}
