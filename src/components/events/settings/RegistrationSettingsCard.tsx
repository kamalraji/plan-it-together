import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, TicketIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';
import { TicketTierManager } from './TicketTierManager';
import { PromoCodeManager } from './PromoCodeManager';
import { GroupTicketSettings } from './GroupTicketSettings';

interface TicketingSettings {
  isFree: boolean;
  allowWaitlist: boolean;
  registrationType: 'OPEN' | 'INVITE_ONLY' | 'APPROVAL_REQUIRED';
}

interface RegistrationSettingsCardProps {
  eventId: string;
  branding: Record<string, any>;
  onUpdate: () => void;
}

const REGISTRATION_TYPES = [
  { value: 'OPEN', label: 'Open Registration', description: 'Anyone can register' },
  { value: 'INVITE_ONLY', label: 'Invite Only', description: 'Only invited users can register' },
  { value: 'APPROVAL_REQUIRED', label: 'Approval Required', description: 'Registrations require approval' },
];

export const RegistrationSettingsCard: React.FC<RegistrationSettingsCardProps> = ({
  eventId,
  branding,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings: TicketingSettings = {
    isFree: true,
    allowWaitlist: false,
    registrationType: 'OPEN',
  };

  const [settings, setSettings] = useState<TicketingSettings>(() => ({
    ...defaultSettings,
    // Try canonical location first, fall back to legacy location
    isFree: branding?.ticketing?.isFree ?? branding?.registration?.isFree ?? true,
    registrationType: branding?.ticketing?.registrationType ?? branding?.registration?.type ?? 'OPEN',
    allowWaitlist: branding?.ticketing?.allowWaitlist ?? branding?.registration?.allowWaitlist ?? false,
  }));

  useEffect(() => {
    setSettings({
      ...defaultSettings,
      // Try canonical location first, fall back to legacy location
      isFree: branding?.ticketing?.isFree ?? branding?.registration?.isFree ?? true,
      registrationType: branding?.ticketing?.registrationType ?? branding?.registration?.type ?? 'OPEN',
      allowWaitlist: branding?.ticketing?.allowWaitlist ?? branding?.registration?.allowWaitlist ?? false,
    });
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedBranding = {
        ...branding,
        // Save to canonical location (ticketing)
        ticketing: settings,
        // Also save to legacy location for backwards compatibility
        registration: {
          type: settings.registrationType,
          isFree: settings.isFree,
          allowWaitlist: settings.allowWaitlist,
        },
      };

      const { error } = await supabase
        .from('events')
        .update({ branding: updatedBranding })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Registration settings have been updated.',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TicketIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Registration & Ticketing</CardTitle>
              <CardDescription>Configure registration type and pricing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Is Free Event */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isFree">Free Event</Label>
            <p className="text-sm text-muted-foreground">
              Toggle off to manage ticket tiers with pricing
            </p>
          </div>
          <Switch
            id="isFree"
            checked={settings.isFree}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, isFree: checked })
            }
          />
        </div>

        {/* Registration Type */}
        <div className="space-y-2">
          <Label htmlFor="registrationType">Registration Type</Label>
          <Select
            value={settings.registrationType}
            onValueChange={(value: 'OPEN' | 'INVITE_ONLY' | 'APPROVAL_REQUIRED') =>
              setSettings({ ...settings, registrationType: value })
            }
          >
            <SelectTrigger id="registrationType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGISTRATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {REGISTRATION_TYPES.find((t) => t.value === settings.registrationType)?.description}
          </p>
        </div>

        {/* Allow Waitlist */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowWaitlist">Allow Waitlist</Label>
            <p className="text-sm text-muted-foreground">
              Enable waitlist when capacity is full
            </p>
          </div>
          <Switch
            id="allowWaitlist"
            checked={settings.allowWaitlist}
            onCheckedChange={(checked) => setSettings({ ...settings, allowWaitlist: checked })}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Ticket Tier Manager - shown when event is not free */}
    {!settings.isFree && (
      <>
        <TicketTierManager eventId={eventId} />
        <PromoCodeManager eventId={eventId} />
      </>
    )}

    {/* Group Ticket Settings - always shown */}
    <GroupTicketSettings eventId={eventId} branding={branding} onUpdate={onUpdate} />
  </>
);
};
