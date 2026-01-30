import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WizardProgress } from './components/WizardProgress';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { BasicProfileStep } from './steps/BasicProfileStep';
import { AboutYouStep } from './steps/AboutYouStep';
import { ConnectivityStep } from './steps/ConnectivityStep';
import { PreferencesStep } from './steps/PreferencesStep';
import {
  useOnboardingState,
  type SelectedRole,
  basicProfileSchema,
  participantAboutSchema,
  organizerAboutSchema,
  connectivitySchema,
  participantPreferencesSchema,
  organizerPreferencesSchema,
} from './hooks/useOnboardingState';
import { z } from 'zod';

type BasicProfileData = z.infer<typeof basicProfileSchema>;
type ParticipantAboutData = z.infer<typeof participantAboutSchema>;
type OrganizerAboutData = z.infer<typeof organizerAboutSchema>;
type ConnectivityData = z.infer<typeof connectivitySchema>;
type ParticipantPreferencesData = z.infer<typeof participantPreferencesSchema>;
type OrganizerPreferencesData = z.infer<typeof organizerPreferencesSchema>;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, refreshUserRoles } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentStep,
    totalSteps,
    data,
    isInitialized,
    updateData,
    nextStep,
    prevStep,
    clearProgress,
  } = useOnboardingState();

  const handleRoleSelect = useCallback((role: SelectedRole) => {
    updateData('role', role);
  }, [updateData]);

  const handleBasicProfileSubmit = useCallback((profileData: BasicProfileData) => {
    updateData('basicProfile', profileData);
    nextStep();
  }, [updateData, nextStep]);

  const handleAboutSubmit = useCallback((aboutData: ParticipantAboutData | OrganizerAboutData) => {
    if (data.role === 'participant') {
      updateData('participantAbout', aboutData as ParticipantAboutData);
    } else {
      updateData('organizerAbout', aboutData as OrganizerAboutData);
    }
    nextStep();
  }, [data.role, updateData, nextStep]);

  const handleConnectivitySubmit = useCallback((connectivityData: ConnectivityData) => {
    updateData('connectivity', connectivityData);
    nextStep();
  }, [updateData, nextStep]);

  const handleConnectivitySkip = useCallback(() => {
    updateData('connectivity', null);
    nextStep();
  }, [updateData, nextStep]);

  const handlePreferencesSubmit = useCallback(async (preferencesData: ParticipantPreferencesData | OrganizerPreferencesData) => {
    if (!user) {
      toast.error('Please sign in to complete onboarding');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save preferences data
      if (data.role === 'participant') {
        updateData('participantPreferences', preferencesData as ParticipantPreferencesData);
      } else {
        updateData('organizerPreferences', preferencesData as OrganizerPreferencesData);
      }

      // Prepare profile update
      const profileUpdate: Record<string, unknown> = {
        full_name: data.basicProfile?.fullName,
        username: data.basicProfile?.username,
        avatar_url: data.basicProfile?.avatarUrl,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 5,
      };

      // Add connectivity data
      if (data.connectivity) {
        profileUpdate.linkedin_url = data.connectivity.linkedinUrl || null;
        profileUpdate.github_url = data.connectivity.githubUrl || null;
        profileUpdate.twitter_url = data.connectivity.twitterUrl || null;
        profileUpdate.phone = data.connectivity.phone || null;
      }

      // Add role-specific data
      if (data.role === 'participant' && data.participantAbout) {
        profileUpdate.organization = data.participantAbout.organization;
        profileUpdate.bio = data.participantAbout.bio;
        profileUpdate.skills = data.participantAbout.skills;
        profileUpdate.experience_level = data.participantAbout.experienceLevel;
      } else if (data.role === 'organizer' && data.organizerAbout) {
        profileUpdate.organization = data.organizerAbout.organization;
        profileUpdate.job_title = data.organizerAbout.jobTitle;
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create user preferences
      if (data.role === 'participant') {
        const pData = preferencesData as ParticipantPreferencesData;
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            event_interests: pData.eventInterests,
            looking_for: pData.lookingFor,
            notification_frequency: pData.notificationFrequency,
          }, { onConflict: 'user_id' });

        if (prefsError) throw prefsError;
      } else {
        const oData = preferencesData as OrganizerPreferencesData;
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            expected_event_types: oData.expectedEventTypes,
            team_size: oData.teamSize,
          }, { onConflict: 'user_id' });

        if (prefsError) throw prefsError;
      }

      // Assign role in user_roles table
      const roleToAssign = data.role === 'organizer' ? 'organizer' : 'participant';
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: roleToAssign }, { onConflict: 'user_id,role' });

      if (roleError) throw roleError;

      // Clear local progress
      clearProgress();

      // Refresh roles
      await refreshUserRoles();

      toast.success('Welcome to Thittam1Hub! 🎉');

      // Navigate based on role
      if (data.role === 'organizer') {
        navigate('/onboarding/organization');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, data, updateData, clearProgress, refreshUserRoles, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const stepLabels = data.role
    ? ['Role', 'Profile', 'About', 'Connect', 'Preferences']
    : ['Role'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8 sm:py-12">
      <div className="container max-w-4xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Thittam1Hub
          </h1>
        </div>

        {/* Progress */}
        {data.role && (
          <WizardProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={stepLabels}
          />
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <RoleSelectionStep
              key="role"
              selectedRole={data.role}
              onRoleSelect={handleRoleSelect}
              onNext={nextStep}
            />
          )}

          {currentStep === 1 && data.role && (
            <BasicProfileStep
              key="profile"
              data={data.basicProfile}
              onSubmit={handleBasicProfileSubmit}
              onBack={prevStep}
            />
          )}

          {currentStep === 2 && data.role && (
            <AboutYouStep
              key="about"
              role={data.role}
              participantData={data.participantAbout}
              organizerData={data.organizerAbout}
              onSubmit={handleAboutSubmit}
              onBack={prevStep}
            />
          )}

          {currentStep === 3 && data.role && (
            <ConnectivityStep
              key="connectivity"
              data={data.connectivity}
              onSubmit={handleConnectivitySubmit}
              onSkip={handleConnectivitySkip}
              onBack={prevStep}
            />
          )}

          {currentStep === 4 && data.role && (
            <PreferencesStep
              key="preferences"
              role={data.role}
              participantData={data.participantPreferences}
              organizerData={data.organizerPreferences}
              onSubmit={handlePreferencesSubmit}
              onBack={prevStep}
              isSubmitting={isSubmitting}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
