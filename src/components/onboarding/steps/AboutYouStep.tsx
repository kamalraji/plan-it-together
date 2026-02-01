import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkillSelector } from '../components/SkillSelector';
import {
  participantAboutSchema,
  organizerAboutSchema,
  type SelectedRole
} from '../hooks/useOnboardingState';

type ParticipantAboutData = z.infer<typeof participantAboutSchema>;
type OrganizerAboutData = z.infer<typeof organizerAboutSchema>;

interface AboutYouStepProps {
  role: SelectedRole;
  participantData: ParticipantAboutData | null;
  organizerData: OrganizerAboutData | null;
  onSubmit: (data: ParticipantAboutData | OrganizerAboutData) => void;
  onBack: () => void;
}

export function AboutYouStep({ role, participantData, organizerData, onSubmit, onBack }: AboutYouStepProps) {
  const isParticipant = role === 'participant';

  // Participant form
  const participantForm = useForm<ParticipantAboutData>({
    resolver: zodResolver(participantAboutSchema),
    defaultValues: {
      organization: participantData?.organization || '',
      bio: participantData?.bio || '',
      skills: participantData?.skills || [],
      experienceLevel: participantData?.experienceLevel || 'intermediate',
    },
  });

  // Organizer form
  const organizerForm = useForm<OrganizerAboutData>({
    resolver: zodResolver(organizerAboutSchema),
    defaultValues: {
      organization: organizerData?.organization || '',
      jobTitle: organizerData?.jobTitle || '',
      organizationType: organizerData?.organizationType,
    },
  });

  const handleParticipantSubmit = (values: ParticipantAboutData) => {
    onSubmit(values);
  };

  const handleOrganizerSubmit = (values: OrganizerAboutData) => {
    onSubmit(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
        >
          Tell Us About Yourself
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          {isParticipant
            ? 'This helps us match you with the right events and teams'
            : 'Tell us about your organization to get started'}
        </motion.p>
      </div>

      {/* Participant Form */}
      {isParticipant && (
        <Form {...participantForm}>
          <form onSubmit={participantForm.handleSubmit(handleParticipantSubmit)} className="space-y-6">
            <FormField
              control={participantForm.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization / College</FormLabel>
                  <FormControl>
                    <Input placeholder="Where do you study or work?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={participantForm.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a bit about yourself..."
                      className="resize-none h-24"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-right">
                    {field.value?.length || 0} / 500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={participantForm.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - Just getting started</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                      <SelectItem value="expert">Expert - Highly experienced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={participantForm.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills & Expertise</FormLabel>
                  <FormDescription>
                    Add skills to help us match you with the right teams and events
                  </FormDescription>
                  <FormControl>
                    <SkillSelector
                      selectedSkills={field.value}
                      onChange={field.onChange}
                      maxSkills={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Organizer Form */}
      {!isParticipant && (
        <Form {...organizerForm}>
          <form onSubmit={organizerForm.handleSubmit(handleOrganizerSubmit)} className="space-y-6">
            <FormField
              control={organizerForm.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your organization or company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={organizerForm.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Event Coordinator, President, Founder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={organizerForm.control}
              name="organizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="college">College / University</SelectItem>
                      <SelectItem value="company">Company / Startup</SelectItem>
                      <SelectItem value="nonprofit">Non-profit / NGO</SelectItem>
                      <SelectItem value="community">Community Group</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      )}
    </motion.div>
  );
}
