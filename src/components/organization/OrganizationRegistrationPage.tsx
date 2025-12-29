import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateOrganization } from '@/hooks/useOrganization';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const organizationRegistrationSchema = z.object({
  name: z.string().trim().min(1, { message: 'Organization name is required' }),
  slug: z
    .string()
    .trim()
    .min(1, { message: 'URL handle is required' })
    .regex(/^[a-z0-9-]+$/, { message: 'Use only lowercase letters, numbers, and hyphens' }),
  category: z.enum(['COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT']),
  description: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

type OrganizationRegistrationValues = z.infer<typeof organizationRegistrationSchema>;

export const OrganizationRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const createOrganization = useCreateOrganization();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<OrganizationRegistrationValues>({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      name: '',
      slug: '',
      category: 'COLLEGE',
      description: '',
      website: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (values: OrganizationRegistrationValues) => {
    setFormError(null);

    try {
      const organization = await createOrganization.mutateAsync({
        name: values.name.trim(),
        slug: values.slug.trim(),
        category: values.category,
        description: values.description?.trim() || undefined,
        website: values.website?.trim() || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      });

      if (organization?.slug) {
        navigate(`/${organization.slug}/dashboard`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to create organization';

      if (message.toLowerCase().includes('url handle') || message.toLowerCase().includes('slug')) {
        form.setError('slug', { message });
      } else {
        setFormError(message);
      }
    }
  };

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');

  const isSubmitting = createOrganization.isPending || form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/80 to-muted px-4 py-8">
      <Card className="w-full max-w-2xl shadow-soft border border-border/60">
        <CardHeader className="space-y-4 pb-4 sm:pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Set up your organization
              </CardTitle>
              <CardDescription>
                Tell us about your organization so we can personalize your organizer dashboard.
              </CardDescription>
            </div>
            <Button
              type="submit"
              form="organization-onboarding-form"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Creating…' : 'Create organization'}
            </Button>
          </div>
          {formError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {formError}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id="organization-onboarding-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="organization"
                          onChange={(e) => {
                            field.onChange(e);
                            if (formError) setFormError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL handle</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="my-org"
                          onChange={(e) => {
                            const normalized = normalizeSlug(e.target.value);
                            field.onChange(normalized);
                            if (formError) setFormError(null);
                          }}
                        />
                      </FormControl>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your organization URL will be:
                        <br />
                        <span className="font-mono text-[11px] sm:text-xs">
                          {typeof window !== 'undefined'
                            ? `${window.location.origin}/${field.value || 'my-org'}`
                            : `/${field.value || 'my-org'}`}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Lowercase letters, numbers, and hyphens only.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (formError) setFormError(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COLLEGE">College / University</SelectItem>
                            <SelectItem value="COMPANY">Company</SelectItem>
                            <SelectItem value="INDUSTRY">Industry body</SelectItem>
                            <SelectItem value="NON_PROFIT">Non-profit / Community</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com"
                          onChange={(e) => {
                            field.onChange(e);
                            if (formError) setFormError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          onChange={(e) => {
                            field.onChange(e);
                            if (formError) setFormError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          onChange={(e) => {
                            field.onChange(e);
                            if (formError) setFormError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Briefly describe your organization and the kind of events you run."
                        className="resize-y rounded-xl border-border bg-card"
                        onChange={(e) => {
                          field.onChange(e);
                          if (formError) setFormError(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 border-t border-border/40 pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">
                  You can update these details later from your organization settings.
                </p>
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? 'Creating…' : 'Create organization'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

