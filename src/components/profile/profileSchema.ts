import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500).optional().or(z.literal('')),
  organization: z.string().max(120).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  socialLinks: z
    .object({
      linkedin: z
        .string()
        .url('Please enter a valid LinkedIn URL')
        .optional()
        .or(z.literal('')),
      twitter: z
        .string()
        .url('Please enter a valid Twitter URL')
        .optional()
        .or(z.literal('')),
      github: z
        .string()
        .url('Please enter a valid GitHub URL')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
