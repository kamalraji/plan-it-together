import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrganization } from '@/hooks/useOrganization';

export const OrganizationRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const createOrganization = useCreateOrganization();
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

      if (organization?.slug) {
        navigate(`/${organization.slug}/dashboard`, { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender/5 to-cream/20 px-4">
      <div className="max-w-2xl w-full bg-card/90 backdrop-blur-sm rounded-2xl shadow-soft border border-coral/10 p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-2">
              Set up your organization
            </h1>
            <p className="text-muted-foreground">
              Tell us about your organization so we can personalize your organizer dashboard.
            </p>
          </div>
          <button
            type="submit"
            form="organization-onboarding-form"
            disabled={createOrganization.isPending}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-transparent shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
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
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
                Organization name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formState.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="slug">
                URL handle
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                  {window.location.origin}/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formState.slug}
                  onChange={handleChange}
                  className="mt-0 flex-1 rounded-r-lg border border-input focus:border-coral focus:ring-coral text-sm"
                  placeholder="your-organization"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formState.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral text-sm"
              >
                <option value="COLLEGE">College / University</option>
                <option value="COMPANY">Company</option>
                <option value="INDUSTRY">Industry body</option>
                <option value="NON_PROFIT">Non-profit / Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formState.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral text-sm"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                Contact email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="phone">
                Contact phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formState.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-input shadow-sm focus:border-coral focus:ring-coral text-sm"
              placeholder="Briefly describe your organization and the kind of events you run."
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4">
            <div className="text-xs text-muted-foreground">
              <p>You can update these details later from your organization settings.</p>
            </div>
            <button
              type="submit"
              disabled={createOrganization.isPending}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
            >
              {createOrganization.isPending ? 'Creating…' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationRegistrationPage;
