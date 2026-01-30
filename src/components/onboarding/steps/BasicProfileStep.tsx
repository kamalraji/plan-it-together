import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, AtSign, Upload } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { basicProfileSchema } from '../hooks/useOnboardingState';

type BasicProfileData = z.infer<typeof basicProfileSchema>;

interface BasicProfileStepProps {
  data: BasicProfileData | null;
  onSubmit: (data: BasicProfileData) => void;
  onBack: () => void;
}

export function BasicProfileStep({ data, onSubmit, onBack }: BasicProfileStepProps) {
  const { user, session } = useAuth();
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Get metadata from session (Google OAuth populates this)
  const metadata = session?.user?.user_metadata || {};
  const googleName = metadata.full_name || metadata.name || '';
  const googleAvatar = metadata.avatar_url || metadata.picture || '';

  const form = useForm<BasicProfileData>({
    resolver: zodResolver(basicProfileSchema),
    defaultValues: {
      fullName: data?.fullName || googleName || user?.name || '',
      username: data?.username || '',
      avatarUrl: data?.avatarUrl || googleAvatar || '',
    },
  });

  const watchedUsername = form.watch('username');
  const { isChecking, isAvailable, error: usernameError, suggestions } = useUsernameValidation(watchedUsername);

  // Update avatar preview
  useEffect(() => {
    const avatarUrl = form.watch('avatarUrl');
    setPreviewAvatar(avatarUrl || googleAvatar || null);
  }, [form.watch('avatarUrl'), googleAvatar]);

  const handleSubmit = (values: BasicProfileData) => {
    if (!isAvailable && watchedUsername.length >= 3) return;
    onSubmit({
      ...values,
      avatarUrl: previewAvatar || values.avatarUrl || googleAvatar,
    });
  };

  const getValidationState = () => {
    if (!watchedUsername || watchedUsername.length < 3) return 'idle';
    if (isChecking) return 'validating';
    if (isAvailable) return 'valid';
    if (usernameError) return 'invalid';
    return 'idle';
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
          Set Up Your Profile
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Let&apos;s personalize your Thittam1Hub experience
        </motion.p>
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center mb-8">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={previewAvatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-coral to-teal text-white text-2xl">
              {form.watch('fullName')?.charAt(0)?.toUpperCase() || <User className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Upload className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="your_username"
                      className="pl-9"
                      validationState={getValidationState()}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  This will be your unique profile URL: thittam1hub.com/@{watchedUsername || 'username'}
                </FormDescription>
                {usernameError && <FormMessage>{usernameError}</FormMessage>}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Try:</span>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue('username', s)}
                        className="text-xs text-primary hover:underline"
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isChecking || (watchedUsername.length >= 3 && !isAvailable)}
            >
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
