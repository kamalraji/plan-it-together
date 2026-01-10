import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Settings,
  ToggleRight,
  Mail,
  Gauge,
  Loader2,
  Save,
} from 'lucide-react';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description: string | null;
  category: string;
  updated_at: string;
}

interface FeatureFlags {
  marketplace_enabled: boolean;
  vendor_registration_enabled: boolean;
  public_events_enabled: boolean;
  email_notifications_enabled: boolean;
}

interface PlatformLimits {
  max_events_per_org: number;
  max_team_members_per_workspace: number;
  max_registrations_per_event: number;
  max_file_upload_mb: number;
}

interface EmailTemplates {
  welcome_subject: string;
  welcome_body: string;
  vendor_approved_subject: string;
  vendor_rejected_subject: string;
}

export const AdminSystemSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAdminAuditLog();
  const [activeTab, setActiveTab] = useState('features');

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return data as SystemSetting[];
    },
  });

  // Get specific settings
  const featureFlags = settings?.find(s => s.key === 'feature_flags')?.value as FeatureFlags | undefined;
  const platformLimits = settings?.find(s => s.key === 'platform_limits')?.value as PlatformLimits | undefined;
  const emailTemplates = settings?.find(s => s.key === 'email_templates')?.value as EmailTemplates | undefined;

  // Local state for editing
  const [editedFeatureFlags, setEditedFeatureFlags] = useState<FeatureFlags | null>(null);
  const [editedLimits, setEditedLimits] = useState<PlatformLimits | null>(null);
  const [editedEmails, setEditedEmails] = useState<EmailTemplates | null>(null);

  // Initialize local state when data loads
  React.useEffect(() => {
    if (featureFlags && !editedFeatureFlags) setEditedFeatureFlags(featureFlags);
    if (platformLimits && !editedLimits) setEditedLimits(platformLimits);
    if (emailTemplates && !editedEmails) setEditedEmails(emailTemplates);
  }, [featureFlags, platformLimits, emailTemplates]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;

      // Log the change via secure edge function
      await logAction({
        action: 'SETTINGS_UPDATED',
        target_type: 'system_settings',
        target_id: key,
        details: { new_value: value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const handleSaveFeatureFlags = () => {
    if (!editedFeatureFlags) return;
    updateSettingMutation.mutate({ key: 'feature_flags', value: editedFeatureFlags });
  };

  const handleSaveLimits = () => {
    if (!editedLimits) return;
    updateSettingMutation.mutate({ key: 'platform_limits', value: editedLimits });
  };

  const handleSaveEmails = () => {
    if (!editedEmails) return;
    updateSettingMutation.mutate({ key: 'email_templates', value: editedEmails });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure platform-wide settings, feature flags, and limits.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="features" className="gap-2">
            <ToggleRight className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="limits" className="gap-2">
            <Gauge className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Feature Flags Tab */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features globally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedFeatureFlags && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketplace</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable the vendor marketplace feature
                      </p>
                    </div>
                    <Switch
                      checked={editedFeatureFlags.marketplace_enabled}
                      onCheckedChange={(checked) =>
                        setEditedFeatureFlags({ ...editedFeatureFlags, marketplace_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Vendor Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new vendors to register
                      </p>
                    </div>
                    <Switch
                      checked={editedFeatureFlags.vendor_registration_enabled}
                      onCheckedChange={(checked) =>
                        setEditedFeatureFlags({ ...editedFeatureFlags, vendor_registration_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Events</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow public event listings
                      </p>
                    </div>
                    <Switch
                      checked={editedFeatureFlags.public_events_enabled}
                      onCheckedChange={(checked) =>
                        setEditedFeatureFlags({ ...editedFeatureFlags, public_events_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={editedFeatureFlags.email_notifications_enabled}
                      onCheckedChange={(checked) =>
                        setEditedFeatureFlags({ ...editedFeatureFlags, email_notifications_enabled: checked })
                      }
                    />
                  </div>
                  <Button onClick={handleSaveFeatureFlags} disabled={updateSettingMutation.isPending}>
                    {updateSettingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Feature Flags
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Limits Tab */}
        <TabsContent value="limits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Limits</CardTitle>
              <CardDescription>
                Set quotas and limits for various platform resources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedLimits && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="max-events">Max Events per Organization</Label>
                      <Input
                        id="max-events"
                        type="number"
                        value={editedLimits.max_events_per_org}
                        onChange={(e) =>
                          setEditedLimits({ ...editedLimits, max_events_per_org: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-team">Max Team Members per Workspace</Label>
                      <Input
                        id="max-team"
                        type="number"
                        value={editedLimits.max_team_members_per_workspace}
                        onChange={(e) =>
                          setEditedLimits({ ...editedLimits, max_team_members_per_workspace: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-registrations">Max Registrations per Event</Label>
                      <Input
                        id="max-registrations"
                        type="number"
                        value={editedLimits.max_registrations_per_event}
                        onChange={(e) =>
                          setEditedLimits({ ...editedLimits, max_registrations_per_event: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-upload">Max File Upload (MB)</Label>
                      <Input
                        id="max-upload"
                        type="number"
                        value={editedLimits.max_file_upload_mb}
                        onChange={(e) =>
                          setEditedLimits({ ...editedLimits, max_file_upload_mb: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveLimits} disabled={updateSettingMutation.isPending}>
                    {updateSettingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Limits
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Configure email subject lines and content templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedEmails && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-subject">Welcome Email Subject</Label>
                      <Input
                        id="welcome-subject"
                        value={editedEmails.welcome_subject}
                        onChange={(e) =>
                          setEditedEmails({ ...editedEmails, welcome_subject: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="welcome-body">Welcome Email Body</Label>
                      <Textarea
                        id="welcome-body"
                        value={editedEmails.welcome_body}
                        onChange={(e) =>
                          setEditedEmails({ ...editedEmails, welcome_body: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-approved">Vendor Approved Subject</Label>
                      <Input
                        id="vendor-approved"
                        value={editedEmails.vendor_approved_subject}
                        onChange={(e) =>
                          setEditedEmails({ ...editedEmails, vendor_approved_subject: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-rejected">Vendor Rejected Subject</Label>
                      <Input
                        id="vendor-rejected"
                        value={editedEmails.vendor_rejected_subject}
                        onChange={(e) =>
                          setEditedEmails({ ...editedEmails, vendor_rejected_subject: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveEmails} disabled={updateSettingMutation.isPending}>
                    {updateSettingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Email Templates
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemSettings;
