import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InterestSelector, LOOKING_FOR_OPTIONS } from '../components/InterestSelector';
import {
  participantPreferencesSchema,
  organizerPreferencesSchema,
  type SelectedRole
} from '../hooks/useOnboardingState';

type ParticipantPreferencesData = z.infer<typeof participantPreferencesSchema>;
type OrganizerPreferencesData = z.infer<typeof organizerPreferencesSchema>;

interface PreferencesStepProps {
  role: SelectedRole;
  participantData: ParticipantPreferencesData | null;
  organizerData: OrganizerPreferencesData | null;
  onSubmit: (data: ParticipantPreferencesData | OrganizerPreferencesData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function PreferencesStep({ 
  role, 
  participantData, 
  organizerData, 
  onSubmit, 
  onBack,
  isSubmitting 
}: PreferencesStepProps) {
  const isParticipant = role === 'participant';

  const participantForm = useForm<ParticipantPreferencesData>({
    resolver: zodResolver(participantPreferencesSchema),
    defaultValues: {
      eventInterests: participantData?.eventInterests || [],
      lookingFor: participantData?.lookingFor || [],
      notificationFrequency: participantData?.notificationFrequency || 'weekly',
    },
  });

  const organizerForm = useForm<OrganizerPreferencesData>({
    resolver: zodResolver(organizerPreferencesSchema),
    defaultValues: {
      expectedEventTypes: organizerData?.expectedEventTypes || [],
      teamSize: organizerData?.teamSize,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-coral to-teal mb-4"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
        >
          Almost There!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          {isParticipant
            ? 'Help us personalize your event recommendations'
            : 'Tell us about your event planning needs'}
        </motion.p>
      </div>

      {/* Participant Form */}
      {isParticipant && (
        <Form {...participantForm}>
          <form onSubmit={participantForm.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={participantForm.control}
              name="eventInterests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What types of events interest you?</FormLabel>
                  <FormDescription>
                    Select the event types you&apos;d like to discover
                  </FormDescription>
                  <FormControl>
                    <InterestSelector
                      selectedInterests={field.value}
                      onChange={field.onChange}
                      type="events"
                      maxSelections={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={participantForm.control}
              name="lookingFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you looking for?</FormLabel>
                  <FormDescription>
                    This helps us match you with the right opportunities
                  </FormDescription>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {LOOKING_FOR_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            const current = field.value;
                            if (current.includes(option.id)) {
                              field.onChange(current.filter((i: string) => i !== option.id));
                            } else if (current.length < 4) {
                              field.onChange([...current, option.id]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            field.value.includes(option.id)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-primary/10 hover:text-primary'
                          } ${field.value.length >= 4 && !field.value.includes(option.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={participantForm.control}
              name="notificationFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Notification Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How often should we email you?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly roundup</SelectItem>
                      <SelectItem value="monthly">Monthly summary</SelectItem>
                      <SelectItem value="never">Never (I&apos;ll check the app)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Organizer Form */}
      {!isParticipant && (
        <Form {...organizerForm}>
          <form onSubmit={organizerForm.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={organizerForm.control}
              name="expectedEventTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What types of events will you organize?</FormLabel>
                  <FormDescription>
                    Select the types of events you plan to create
                  </FormDescription>
                  <FormControl>
                    <InterestSelector
                      selectedInterests={field.value}
                      onChange={field.onChange}
                      type="events"
                      maxSelections={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={organizerForm.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size</FormLabel>
                  <FormDescription>
                    How big is your organizing team?
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="solo">Just me</SelectItem>
                      <SelectItem value="small">Small team (2-5 people)</SelectItem>
                      <SelectItem value="medium">Medium team (6-20 people)</SelectItem>
                      <SelectItem value="large">Large organization (20+ people)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </motion.div>
  );
}
