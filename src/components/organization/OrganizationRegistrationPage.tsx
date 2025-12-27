import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';

export const OrganizationRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const createOrganization = useCreateOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    category: 'COLLEGE' as 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT',
    description: '',
    website: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{ name?: string; slug?: string; form?: string }>({});
  const [createdOrg, setCreatedOrg] = useState<{ id: string; slug: string } | null>(null);
  const [isCheckingExistingOrg, setIsCheckingExistingOrg] = useState(true);
  const [roleStatus, setRoleStatus] = useState<'idle' | 'checking' | 'granted' | 'failed'>('idle');

  useEffect(() => {
    const checkExistingOrg = async () => {
      if (!user?.id) {
        setIsCheckingExistingOrg(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, slug')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!error && data?.slug && data?.id) {
          setCreatedOrg({ id: data.id, slug: data.slug });
          return;
        }
      } catch (err) {
        console.error('Failed to check existing organization', err);
      } finally {
        setIsCheckingExistingOrg(false);
      }
    };

    void checkExistingOrg();
  }, [user?.id]);

  // After an organization is created, wait for organizer role to be applied
  useEffect(() => {
    if (!createdOrg || !user?.id || roleStatus === 'granted' || roleStatus === 'failed') {
      return;
    }

    let isCancelled = false;

    const checkRole = async (attempt: number) => {
      if (isCancelled) return;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (!error && data && data.some((row: { role: string }) => row.role === 'organizer' || row.role === 'admin')) {
          if (!isCancelled) {
            setRoleStatus('granted');
          }
          return;
        }
      } catch (err) {
        console.warn('Error while checking organizer role after org creation', err);
      }

      if (attempt >= 10 || isCancelled) {
        if (!isCancelled) {
          setRoleStatus('failed');
        }
        return;
      }

      setTimeout(() => void checkRole(attempt + 1), 1000);
    };

    setRoleStatus('checking');
    void checkRole(1);

    return () => {
      isCancelled = true;
    };
  }, [createdOrg, user?.id, roleStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Normalize slug input and clear field-specific errors
    if (name === 'slug') {
      const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormState((prev) => ({ ...prev, slug: normalized }));
      setErrors((prev) => ({ ...prev, slug: undefined, form: undefined }));
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic client-side validation
    const newErrors: { name?: string; slug?: string } = {};
    if (!formState.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    if (!formState.slug.trim()) {
      newErrors.slug = 'URL handle is required';
    } else if (!/^[a-z0-9-]+$/.test(formState.slug)) {
      newErrors.slug = 'Use only lowercase letters, numbers, and hyphens';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    try {
      const organization = await createOrganization.mutateAsync({
        name: formState.name.trim(),
        slug: formState.slug.trim(),
        category: formState.category,
        description: formState.description.trim() || undefined,
        website: formState.website.trim() || undefined,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
      });

      // After successfully creating an organization, automatically grant
      // organizer role to the current user via a secure edge function.
      try {
        const { error } = await supabase.functions.invoke('self-approve-organizer');
        if (error) {
          console.error('Failed to self-approve organizer role', error);
          toast({
            title: 'Organization created, but role upgrade failed',
            description:
              'Your organization is ready, but we could not automatically grant organizer access. A Thittam1Hub admin may need to help.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Unexpected error invoking self-approve-organizer', err);
      }

      if (organization?.slug) {
        setCreatedOrg(organization);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to create organization';

      // Surface duplicate-slug and other field errors inline
      if (message.toLowerCase().includes('url handle') || message.toLowerCase().includes('slug')) {
        setErrors({ slug: message });
      } else {
        setErrors({ form: message });
      }
      // The hook already shows a toast; no need to re-toast here.
    }
  };

  if (isCheckingExistingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender/5 to-cream/20 px-4">
        <div className="text-sm text-gray-600">Preparing your organizer dashboard…</div>
      </div>
    );
  }

  if (createdOrg) {
    const orgDashboardPath = `/${createdOrg.slug}/dashboard`;
    const isWaitingForRole = roleStatus === 'checking' || roleStatus === 'idle';
    const roleFailed = roleStatus === 'failed';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender/5 to-cream/20 px-4">
        <div className="max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-coral/10 p-8 text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Organization created!
          </h1>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">{formState.name || 'Your organization'}</span> is ready.
            {roleStatus === 'granted'
              ? ' Organizer access has been granted. Use the button below to open your organizer dashboard.'
              : ' We are finalizing your organizer access. This usually takes just a few seconds.'}
          </p>
          {roleFailed && (
            <p className="text-xs text-red-500">
              We could not confirm organizer access yet. You can continue to your main dashboard and try again later,
              or contact a Thittam1Hub admin if this persists.
            </p>
          )}
          <button
            type="button"
            disabled={isWaitingForRole}
            onClick={() => {
              if (roleStatus === 'granted') {
                navigate(orgDashboardPath, { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            }}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg border border-transparent shadow-sm text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral disabled:opacity-60"
          >
            {isWaitingForRole
              ? 'Preparing your organizer dashboard…'
              : roleStatus === 'granted'
                ? 'Go to organizer dashboard'
                : 'Go to main dashboard'}
          </button>
          <p className="text-xs text-gray-400">
            Or visit
            <span className="ml-1 font-mono text-gray-500">
              {window.location.origin}
              {roleStatus === 'granted' ? orgDashboardPath : '/dashboard'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender/5 to-cream/20 px-4">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-coral/10 p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-2">
              Set up your organization
            </h1>
            <p className="text-gray-600">
              Tell us about your organization so we can personalize your organizer dashboard.
            </p>
          </div>
          <button
            type="submit"
            form="organization-onboarding-form"
            disabled={createOrganization.isPending}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-transparent shadow-sm text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral disabled:opacity-60"
          >
            {createOrganization.isPending ? 'Creating…' : 'Create organization'}
          </button>
        </div>
        {errors.form && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
            {errors.form}
          </div>
        )}

        <form id="organization-onboarding-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Organization name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formState.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="slug">
                URL handle
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  {window.location.origin}/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formState.slug}
                  onChange={handleChange}
                  className="mt-0 flex-1 rounded-r-lg border border-gray-300 focus:border-coral focus:ring-coral text-sm"
                  placeholder="your-organization"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formState.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral text-sm"
              >
                <option value="COLLEGE">College / University</option>
                <option value="COMPANY">Company</option>
                <option value="INDUSTRY">Industry body</option>
                <option value="NON_PROFIT">Non-profit / Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formState.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral text-sm"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Contact email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                Contact phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formState.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-coral focus:ring-coral text-sm"
              placeholder="Briefly describe your organization and the kind of events you run."
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4">
            <div className="text-xs text-gray-500">
              <p>You can update these details later from your organization settings.</p>
              {user && (user as any).role === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const { error } = await supabase.functions.invoke('approve-organizer', {
                        body: { userId: user.id },
                      });
                      if (error) throw error;
                      toast({
                        title: 'Organizer approved',
                        description: 'You now have organizer-level access.',
                      });
                    } catch (err: any) {
                      toast({
                        title: 'Approval failed',
                        description: err?.message || 'Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="mt-2 inline-flex items-center text-[11px] font-medium text-coral hover:text-coral-light"
                >
                  Approve organizer access for this user
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={createOrganization.isPending}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral disabled:opacity-60"
            >
              {createOrganization.isPending ? 'Creating…' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
