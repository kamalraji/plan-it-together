import React from 'react';
import { Bell, Clock, Mail, Smartphone, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

interface NotificationPreferencesPanelProps {
  userId: string;
  className?: string;
}

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  userId,
  className,
}) => {
  const {
    preferences,
    isLoading,
    updatePreference,
    isSaving,
  } = useNotificationPreferences(userId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how and when you receive notifications
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Smart Batching Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Smart Batching
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="batch-enabled">Enable notification batching</Label>
              <p className="text-xs text-muted-foreground">
                Group notifications together to reduce interruptions
              </p>
            </div>
            <Switch
              id="batch-enabled"
              checked={preferences?.batch_enabled ?? true}
              onCheckedChange={(checked) => updatePreference('batch_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          {preferences?.batch_enabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label className="text-sm">Batch window: {preferences?.batch_window_minutes || 5} minutes</Label>
              <Slider
                value={[preferences?.batch_window_minutes || 5]}
                onValueChange={([value]) => updatePreference('batch_window_minutes', value)}
                min={1}
                max={30}
                step={1}
                className="w-full max-w-xs"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Notifications will be grouped within this time window
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quiet Hours Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            Quiet Hours
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Enable quiet hours</Label>
              <p className="text-xs text-muted-foreground">
                Pause non-urgent notifications during specific times
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={preferences?.quiet_hours_enabled ?? false}
              onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          {preferences?.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label className="text-xs">Start time</Label>
                <Select
                  value={preferences?.quiet_hours_start || '22:00'}
                  onValueChange={(value) => updatePreference('quiet_hours_start', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End time</Label>
                <Select
                  value={preferences?.quiet_hours_end || '08:00'}
                  onValueChange={(value) => updatePreference('quiet_hours_end', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Email Digest Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-digest">Email digest</Label>
              <p className="text-xs text-muted-foreground">
                Receive a summary of notifications via email
              </p>
            </div>
            <Switch
              id="email-digest"
              checked={preferences?.email_digest_enabled ?? true}
              onCheckedChange={(checked) => updatePreference('email_digest_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          {preferences?.email_digest_enabled && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label className="text-xs">Frequency</Label>
              <Select
                value={preferences?.email_digest_frequency || 'daily'}
                onValueChange={(value) => updatePreference('email_digest_frequency', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="h-9 w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        {/* Push Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            Push Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable push notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={preferences?.push_enabled ?? true}
              onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesPanel;
