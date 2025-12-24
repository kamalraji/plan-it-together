import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';

/**
 * OrganizationSettingsPage provides AWS-style interface for organization settings management.
 * Features:
 * - Organization branding configuration
 * - Policy and preference settings
 * - Integration management
 * - Role-based access controls
 */
export const OrganizationSettingsPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Mock data - in real implementation, this would come from API
    const mockOrganization = {
      id: organizationId,
      name: 'Tech Innovation Hub',
      category: 'COMPANY',
      role: 'OWNER',
      description: 'Leading technology innovation and startup acceleration',
      branding: {
        logoUrl: null,
        bannerUrl: null,
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
      },
      settings: {
        visibility: 'PUBLIC',
        allowFollowers: true,
        requireApprovalForEvents: false,
        emailNotifications: true,
        memberCanCreateEvents: true,
      },
      socialLinks: {
        website: 'https://techinnovationhub.com',
        linkedin: 'https://linkedin.com/company/tech-innovation-hub',
        twitter: '',
        facebook: '',
      },
    };

    setTimeout(() => {
      setOrganization(mockOrganization);
      setLoading(false);
    }, 500);
  }, [organizationId]);

  const handleSave = async (section: string, data: any) => {
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${section}:`, data);
      // Update local state
      setOrganization((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], ...data }
      }));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">The organization you are looking for does not exist.</p>
          <Link
            to="/console/organizations"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has permission to manage settings
  const canManageSettings = organization.role === 'OWNER' || organization.role === 'ADMIN';

  if (!canManageSettings) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to manage settings for this organization.</p>
          <Link
            to={`/console/organizations/${organizationId}`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  const pageActions = [
    {
      label: 'View Organization',
      action: () => { window.location.href = `/console/organizations/${organizationId}`; },
      variant: 'secondary' as const,
    },
    {
      label: 'Manage Members',
      action: () => { window.location.href = `/console/organizations/${organizationId}/members`; },
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Organizations', href: '/console/organizations' },
    { label: organization.name, href: `/console/organizations/${organizationId}` },
    { label: 'Settings', href: `/console/organizations/${organizationId}/settings` },
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
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        defaultValue={organization.name}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        defaultValue={organization.category}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="COMPANY">Company</option>
                        <option value="COLLEGE">College</option>
                        <option value="INDUSTRY">Industry</option>
                        <option value="NON_PROFIT">Non-Profit</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={organization.description}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleSave('general', {})}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Allow Followers</h4>
                        <p className="text-sm text-gray-500">Allow users to follow your organization for updates</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.allowFollowers}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Member Can Create Events</h4>
                        <p className="text-sm text-gray-500">Allow organization members to create events</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.memberCanCreateEvents}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Send email notifications for organization activities</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={organization.settings.emailNotifications}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Banner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Logo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Upload organization logo</p>
                        <button className="mt-2 text-sm text-blue-600 hover:text-blue-500">Choose file</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Upload banner image</p>
                        <button className="mt-2 text-sm text-blue-600 hover:text-blue-500">Choose file</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          defaultValue={organization.branding.primaryColor}
                          className="h-10 w-20 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          defaultValue={organization.branding.primaryColor}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          defaultValue={organization.branding.secondaryColor}
                          className="h-10 w-20 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          defaultValue={organization.branding.secondaryColor}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Visibility
                    </label>
                    <select
                      defaultValue={organization.settings.visibility}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PUBLIC">Public - Anyone can view and follow</option>
                      <option value="PRIVATE">Private - Only members can view</option>
                      <option value="UNLISTED">Unlisted - Viewable with direct link only</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Require Approval for Events</h4>
                      <p className="text-sm text-gray-500">Require admin approval before events are published</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={organization.settings.requireApprovalForEvents}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.website}
                        placeholder="https://example.com"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.linkedin}
                        placeholder="https://linkedin.com/company/your-company"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        defaultValue={organization.socialLinks.twitter}
                        placeholder="https://twitter.com/yourcompany"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">External Integrations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📧</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Email Marketing</h4>
                          <p className="text-sm text-gray-500">Connect with Mailchimp, SendGrid, or other email services</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Configure
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Analytics</h4>
                          <p className="text-sm text-gray-500">Connect with Google Analytics or other tracking services</p>
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