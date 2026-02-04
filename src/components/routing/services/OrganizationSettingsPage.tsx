import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganization, useUpdateOrganization, useMyOrganizationMemberships } from '@/hooks/useOrganization';
import { z } from 'zod';

/**
 * OrganizationSettingsPage provides interface for organization settings management.
 * It now reads and updates data from the real `organizations` table instead of mock data.
 */
export const OrganizationSettingsPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orgData, isLoading } = useOrganization(organizationId || '');
  const updateOrganization = useUpdateOrganization(organizationId || '');

  const [organization, setOrganization] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoImageUrl, setSeoImageUrl] = useState('');

  useEffect(() => {
    if (!orgData) return;

    setOrganization((prev: any) => {
      const base = prev || {};

      return {
        ...orgData,
        // Provide sensible defaults for nested settings used by the legacy UI
        settings: {
          visibility: 'PUBLIC',
          allowFollowers: true,
          requireApprovalForEvents: false,
          emailNotifications: true,
          memberCanCreateEvents: true,
          ...(base.settings || {}),
        },
        branding: {
          logoUrl: null,
          bannerUrl: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          ...(base.branding || {}),
        },
        socialLinks: {
          website: orgData.website || '',
          linkedin: '',
          twitter: '',
          ...(base.socialLinks || {}),
        },
      };
    });

    setSeoTitle(orgData.seo_title || '');
    setSeoDescription(orgData.seo_description || '');
    setSeoImageUrl(orgData.seo_image_url || '');
  }, [orgData]);

  const orgProfileSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Organization name is required')
      .max(120, 'Organization name must be at most 120 characters'),
    category: z.enum(['COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT']),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be at most 1000 characters')
      .optional()
      .or(z.literal('')),
    website: z
      .string()
      .trim()
      .url('Please enter a valid URL starting with http or https')
      .max(255)
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .max(255)
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .max(50, 'Phone number must be at most 50 characters')
      .optional()
      .or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    state: z.string().trim().max(120).optional().or(z.literal('')),
    country: z.string().trim().max(120).optional().or(z.literal('')),
  });

  const brandingSeoSchema = z.object({
    logo_url: z
      .string()
      .trim()
      .url('Please enter a valid logo URL starting with http or https')
      .max(1024)
      .optional()
      .or(z.literal('')),
    banner_url: z
      .string()
      .trim()
      .url('Please enter a valid banner URL starting with http or https')
      .max(1024)
      .optional()
      .or(z.literal('')),
    primary_color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/i, 'Use a valid hex color like #2563EB')
      .optional()
      .or(z.literal('')),
    secondary_color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/i, 'Use a valid hex color like #4B5563')
      .optional()
      .or(z.literal('')),
    seo_title: z
      .string()
      .trim()
      .max(120, 'SEO title must be at most 120 characters')
      .optional()
      .or(z.literal('')),
    seo_description: z
      .string()
      .trim()
      .max(200, 'SEO description must be at most 200 characters')
      .optional()
      .or(z.literal('')),
    seo_image_url: z
      .string()
      .trim()
      .url('Please enter a valid SEO image URL starting with http or https')
      .max(1024)
      .optional()
      .or(z.literal('')),
  });

  const handleGeneralSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !organizationId) return;

    const formData = new FormData(event.currentTarget);

    const rawValues = {
      name: String(formData.get('name') ?? ''),
      category: String(formData.get('category') ?? 'COMPANY') as any,
      description: String(formData.get('description') ?? ''),
      website: String(formData.get('website') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      city: String(formData.get('city') ?? ''),
      state: String(formData.get('state') ?? ''),
      country: String(formData.get('country') ?? ''),
    };

    const result = orgProfileSchema.safeParse(rawValues);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const values = result.data;
    setErrors({});
    setSaving(true);

    try {
      await updateOrganization.mutateAsync({
        name: values.name.trim(),
        category: values.category,
        description: values.description?.trim() || undefined,
        website: values.website?.trim() || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
        country: values.country?.trim() || undefined,
      });

      setOrganization((prev: any) =>
        prev
          ? {
              ...prev,
              name: values.name.trim(),
              category: values.category,
              description: values.description,
              website: values.website,
              email: values.email,
              phone: values.phone,
              city: values.city,
              state: values.state,
              country: values.country,
            }
          : prev,
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !organization) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">The organization you are looking for does not exist.</p>
          <Link
            to="/dashboard/organizations"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
             Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  const { data: memberships, isLoading: membershipsLoading } = useMyOrganizationMemberships();

  const activeMembership = Array.isArray(memberships)
    ? memberships.find(
        (m: any) => m.organization_id === organization.id && m.status === 'ACTIVE',
      )
    : undefined;

  const canManageSettings =
    !!user &&
    !!organization &&
    (organization.owner_id === user.id ||
      (activeMembership &&
        (activeMembership.role === 'OWNER' || activeMembership.role === 'ADMIN')));

  if (membershipsLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to manage settings for this organization.</p>
          <Link
            to={`/dashboard/organizations/${organizationId}`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
             Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  const pageActions = [
    {
      label: 'View Organization',
      action: () => navigate(`/dashboard/organizations/${organizationId}`),
      variant: 'secondary' as const,
    },
    {
      label: 'Manage Members',
      action: () => navigate(`/dashboard/organizations/${organizationId}/members`),
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: organization.name, href: `/dashboard/organizations/${organizationId}` },
    { label: 'Settings', href: `/dashboard/organizations/${organizationId}/settings` },
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Organization Settings"
          subtitle={`Configure settings for ${organization.name}`}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />

        <div className="mt-8">
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'general' && (
              <form className="space-y-6" onSubmit={handleGeneralSubmit} noValidate>
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={organization.name}
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={organization.category}
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      >
                        <option value="COMPANY">Company</option>
                        <option value="COLLEGE">College</option>
                        <option value="INDUSTRY">Industry</option>
                        <option value="NON_PROFIT">Non-Profit</option>
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={organization.description || ''}
                      className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        defaultValue={organization.website || ''}
                        placeholder="https://example.com"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.website && (
                        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={organization.email || ''}
                        placeholder="org@example.com"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={organization.phone || ''}
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        defaultValue={organization.city || ''}
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        State / Country
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          name="state"
                          placeholder="State / Region"
                          defaultValue={organization.state || ''}
                          className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                        />
                        <input
                          type="text"
                          name="country"
                          placeholder="Country"
                          defaultValue={organization.country || ''}
                          className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                        />
                      </div>
                      {(errors.state || errors.country) && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.state || errors.country}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={saving || updateOrganization.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      {saving || updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Organization Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Allow Followers</h4>
                        <p className="text-sm text-muted-foreground">Allow users to follow your organization for updates</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.allowFollowers}
                        className="h-4 w-4 text-blue-600 focus-visible:ring-ring border-input rounded"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Member Can Create Events</h4>
                        <p className="text-sm text-muted-foreground">Allow organization members to create events</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.memberCanCreateEvents}
                        className="h-4 w-4 text-blue-600 focus-visible:ring-ring border-input rounded"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">Send email notifications for organization activities</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.emailNotifications}
                        className="h-4 w-4 text-blue-600 focus-visible:ring-ring border-input rounded"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'branding' && (
              <form
                className="space-y-6"
                onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  if (!organization || !organizationId) return;

                  const formData = new FormData(event.currentTarget);
                  const rawValues = {
                    logo_url: String(formData.get('logo_url') ?? ''),
                    banner_url: String(formData.get('banner_url') ?? ''),
                    primary_color: String(formData.get('primary_color') ?? ''),
                    secondary_color: String(formData.get('secondary_color') ?? ''),
                    seo_title: String(formData.get('seo_title') ?? ''),
                    seo_description: String(formData.get('seo_description') ?? ''),
                    seo_image_url: String(formData.get('seo_image_url') ?? ''),
                  };

                  const result = brandingSeoSchema.safeParse(rawValues);

                  if (!result.success) {
                    const fieldErrors: Record<string, string> = {};
                    for (const issue of result.error.issues) {
                      const path = issue.path[0] as string;
                      if (!fieldErrors[path]) {
                        fieldErrors[path] = issue.message;
                      }
                    }
                    setErrors(fieldErrors);
                    return;
                  }

                  const values = result.data;
                  setErrors({});
                  setSaving(true);

                  try {
                    await updateOrganization.mutateAsync({
                      logo_url: values.logo_url?.trim() || null,
                      banner_url: values.banner_url?.trim() || null,
                      primary_color: values.primary_color?.trim() || null,
                      secondary_color: values.secondary_color?.trim() || null,
                      seo_title: values.seo_title?.trim() || null,
                      seo_description: values.seo_description?.trim() || null,
                      seo_image_url: values.seo_image_url?.trim() || null,
                    });

                    setOrganization((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            logo_url: values.logo_url || null,
                            banner_url: values.banner_url || null,
                            primary_color: values.primary_color || null,
                            secondary_color: values.secondary_color || null,
                            seo_title: values.seo_title || null,
                            seo_description: values.seo_description || null,
                            seo_image_url: values.seo_image_url || null,
                          }
                        : prev,
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                noValidate
              >
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Logo & Banner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        name="logo_url"
                        defaultValue={organization.logo_url || ''}
                        placeholder="https://.../logo.png"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.logo_url && (
                        <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Banner URL
                      </label>
                      <input
                        type="url"
                        name="banner_url"
                        defaultValue={organization.banner_url || ''}
                        placeholder="https://.../banner.jpg"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                      {errors.banner_url && (
                        <p className="mt-1 text-sm text-red-600">{errors.banner_url}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          name="primary_color"
                          defaultValue={organization.primary_color || '#3B82F6'}
                          className="h-10 w-20 border border-input rounded-md"
                        />
                        <input
                          type="text"
                          defaultValue={organization.primary_color || '#3B82F6'}
                          className="flex-1 border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                          onChange={(e) => {
                            // Keep color input in sync when typing hex value
                            const form = e.currentTarget.form;
                            const colorInput = form?.elements.namedItem('primary_color') as HTMLInputElement | null;
                            if (colorInput) colorInput.value = e.currentTarget.value;
                          }}
                        />
                      </div>
                      {errors.primary_color && (
                        <p className="mt-1 text-sm text-red-600">{errors.primary_color}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          name="secondary_color"
                          defaultValue={organization.secondary_color || '#1E40AF'}
                          className="h-10 w-20 border border-input rounded-md"
                        />
                        <input
                          type="text"
                          defaultValue={organization.secondary_color || '#1E40AF'}
                          className="flex-1 border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                          onChange={(e) => {
                            const form = e.currentTarget.form;
                            const colorInput = form?.elements.namedItem('secondary_color') as HTMLInputElement | null;
                            if (colorInput) colorInput.value = e.currentTarget.value;
                          }}
                        />
                      </div>
                      {errors.secondary_color && (
                        <p className="mt-1 text-sm text-red-600">{errors.secondary_color}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">SEO Settings</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          SEO Title
                        </label>
                        <input
                          type="text"
                          name="seo_title"
                          value={seoTitle}
                          onChange={(e) => setSeoTitle(e.target.value)}
                          placeholder="Custom page title"
                          className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                        />
                        {errors.seo_title && (
                          <p className="mt-1 text-sm text-red-600">{errors.seo_title}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          SEO Description
                        </label>
                        <textarea
                          name="seo_description"
                          rows={3}
                          value={seoDescription}
                          onChange={(e) => setSeoDescription(e.target.value)}
                          placeholder="Short description shown in search and social previews"
                          className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                        />
                        {errors.seo_description && (
                          <p className="mt-1 text-sm text-red-600">{errors.seo_description}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          SEO Image URL
                        </label>
                        <input
                          type="url"
                          name="seo_image_url"
                          value={seoImageUrl}
                          onChange={(e) => setSeoImageUrl(e.target.value)}
                          placeholder="https://.../social-card.png"
                          className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                        />
                        {errors.seo_image_url && (
                          <p className="mt-1 text-sm text-red-600">{errors.seo_image_url}</p>
                        )}
                      </div>
                    </div>

                    {/* Live SEO Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Live Preview</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        This is an approximate preview of how your organization page may appear in search
                        results and social shares. Actual rendering can vary per platform.
                      </p>

                      {/* Search result style preview */}
                      <div className="border border-border rounded-lg p-4 bg-muted/50 mb-6">
                        <p className="text-xs text-muted-foreground mb-1 truncate">
                          {(organization.website || window.location.origin) + `/org/${organization.slug}`}
                        </p>
                        <p className="text-sm font-medium text-blue-700 mb-1 truncate">
                          {(seoTitle || organization.seo_title || organization.name) || 'Organization title'}
                        </p>
                        <p className="text-xs text-foreground line-clamp-2">
                          {(
                            seoDescription ||
                            organization.seo_description ||
                            organization.description ||
                            'Add a concise description to help people understand what your organization does.'
                          ).slice(0, 200)}
                        </p>
                      </div>

                      {/* Social card style preview */}
                      <div className="border border-border rounded-lg overflow-hidden bg-card">
                        {(
                          seoImageUrl ||
                          organization.seo_image_url ||
                          organization.banner_url ||
                          organization.logo_url
                        ) && (
                          <div className="h-32 bg-muted overflow-hidden">
                            <img
                              src={
                                seoImageUrl ||
                                organization.seo_image_url ||
                                organization.banner_url ||
                                organization.logo_url
                              }
                              alt="SEO preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-1 truncate">{window.location.host}</p>
                          <p className="text-sm font-semibold text-foreground mb-1 truncate">
                            {(seoTitle || organization.seo_title || organization.name) || 'Organization title'}
                          </p>
                          <p className="text-xs text-foreground line-clamp-2">
                            {(
                              seoDescription ||
                              organization.seo_description ||
                              organization.description ||
                              'This is how your organization will appear when shared on social media.'
                            ).slice(0, 140)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || updateOrganization.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {saving || updateOrganization.isPending ? 'Saving...' : 'Save Branding & SEO'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Privacy Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Organization Visibility
                    </label>
                    <select
                      defaultValue={organization.settings.visibility}
                      className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                    >
                      <option value="PUBLIC">Public - Anyone can view and follow</option>
                      <option value="PRIVATE">Private - Only members can view</option>
                      <option value="UNLISTED">Unlisted - Viewable with direct link only</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Require Approval for Events</h4>
                      <p className="text-sm text-muted-foreground">Require admin approval before events are published</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={organization.settings.requireApprovalForEvents}
                      className="h-4 w-4 text-blue-600 focus-visible:ring-ring border-input rounded"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Social Links</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.website}
                        placeholder="https://example.com"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.linkedin}
                        placeholder="https://linkedin.com/company/your-company"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.twitter}
                        placeholder="https://twitter.com/yourcompany"
                        className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">External Integrations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📧</span>
                        <div>
                          <h4 className="font-medium text-foreground">Email Marketing</h4>
                          <p className="text-sm text-muted-foreground">Connect with Mailchimp, SendGrid, or other email services</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Configure
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <h4 className="font-medium text-foreground">Analytics</h4>
                          <p className="text-sm text-muted-foreground">Connect with Google Analytics or other tracking services</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettingsPage;
