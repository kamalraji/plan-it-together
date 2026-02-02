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
import { OrganizationSetupStep, type OrganizationSetupData } from './steps/OrganizationSetupStep';
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
import { useCreateOrganization, useRequestJoinOrganization } from '@/hooks/useOrganization';
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
  const [isOrgSubmitting, setIsOrgSubmitting] = useState(false);
  const [createdOrgSlug, setCreatedOrgSlug] = useState<string | null>(null);

  const createOrganization = useCreateOrganization();
  const requestJoinOrganization = useRequestJoinOrganization();

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

  // Handle organization setup for organizers (step 2)
  const handleOrganizationSetupSubmit = useCallback(async (orgData: OrganizationSetupData) => {
    setIsOrgSubmitting(true);
    
    try {
      if (orgData.action === 'create') {
        // Create organization via edge function
        const result = await createOrganization.mutateAsync({
          name: orgData.name,
          slug: orgData.slug,
          category: orgData.category,
          description: orgData.description,
          website: orgData.website || undefined,
          email: orgData.email || undefined,
        });
        
        setCreatedOrgSlug(result.slug);
        updateData('organizationSetup', orgData);
        toast.success('Organization created successfully!');
        nextStep();
      } else if (orgData.action === 'join') {
        // Request to join organization
        await requestJoinOrganization.mutateAsync(orgData.organizationId);
        updateData('organizationSetup', orgData);
        toast.success('Join request sent! You\'ll be notified when approved.');
        nextStep();
      }
    } catch (error: any) {
      // Error already handled by mutation hooks
      console.error('Organization setup error:', error);
    } finally {
      setIsOrgSubmitting(false);
    }
  }, [createOrganization, requestJoinOrganization, updateData, nextStep]);

  const handleOrganizationSetupSkip = useCallback(() => {
    updateData('organizationSetup', { action: 'skip' });
    nextStep();
  }, [updateData, nextStep]);

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
      // Don't block navigation on role refresh (can occasionally stall due to network/RLS).
      // The app will naturally re-resolve roles on subsequent auth/route checks.
      void refreshUserRoles().catch(() => {
        // Intentionally swallow to avoid blocking UX.
      });

      toast.success('Welcome to Thittam1Hub! 🎉');

      // Navigate based on role and organization setup
      if (data.role === 'organizer') {
        const orgSetup = data.organizationSetup;
        const slugFromSetup = orgSetup?.action === 'create' ? orgSetup.slug : null;
        const finalOrgSlug = createdOrgSlug ?? slugFromSetup;

        if (finalOrgSlug) {
          // Created an organization - go to org dashboard
          navigate(`/${finalOrgSlug}/dashboard`, { replace: true });
          return;
        }

        if (orgSetup?.action === 'join') {
          // Requested to join - go to main dashboard with pending status
          navigate('/dashboard', { replace: true });
          return;
        }

        // Skipped - go to organization setup page
        navigate('/onboarding/organization', { replace: true });
        return;
      } else {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      const errorMessage = error?.message || error?.error_description || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, data, createdOrgSlug, updateData, clearProgress, refreshUserRoles, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Step labels differ by role
  const stepLabels = data.role
    ? data.role === 'organizer'
      ? ['Role', 'Profile', 'Organization', 'Connect', 'Preferences']
      : ['Role', 'Profile', 'About', 'Connect', 'Preferences']
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

          {/* Step 2: Different for participants vs organizers */}
          {currentStep === 2 && data.role === 'participant' && (
            <AboutYouStep
              key="about"
              role={data.role}
              participantData={data.participantAbout}
              organizerData={null}
              onSubmit={handleAboutSubmit}
              onBack={prevStep}
            />
          )}

          {currentStep === 2 && data.role === 'organizer' && (
            <OrganizationSetupStep
              key="organization"
              data={data.organizationSetup}
              onSubmit={handleOrganizationSetupSubmit}
              onSkip={handleOrganizationSetupSkip}
              onBack={prevStep}
              isSubmitting={isOrgSubmitting}
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
