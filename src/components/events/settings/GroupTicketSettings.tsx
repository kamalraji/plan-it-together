import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';

interface GroupTicketSettingsData {
  allowGroupPurchase: boolean;
  maxTicketsPerOrder: number;
  requireAttendeeDetails: boolean;
  collectAttendeeEmail: boolean;
  collectAttendeePhone: boolean;
}

interface GroupTicketSettingsProps {
  eventId: string;
  branding: Record<string, any>;
  onUpdate: () => void;
}

export const GroupTicketSettings: React.FC<GroupTicketSettingsProps> = ({
  eventId,
  branding,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings: GroupTicketSettingsData = {
    allowGroupPurchase: true,
    maxTicketsPerOrder: 10,
    requireAttendeeDetails: false,
    collectAttendeeEmail: true,
    collectAttendeePhone: false,
  };

  const [settings, setSettings] = useState<GroupTicketSettingsData>(() => ({
    ...defaultSettings,
    ...branding?.groupTickets,
  }));

  useEffect(() => {
    setSettings({
      ...defaultSettings,
      ...branding?.groupTickets,
    });
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedBranding = {
        ...branding,
        groupTickets: settings,
      };

      const { error } = await supabase
        .from('events')
        .update({ branding: updatedBranding })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Group ticket settings have been updated.',
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Group Purchases</CardTitle>
            <CardDescription>Configure multi-ticket purchases and attendee collection</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allow Group Purchase */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowGroupPurchase">Allow Group Purchases</Label>
            <p className="text-sm text-muted-foreground">
              Let users buy multiple tickets in one order
            </p>
          </div>
          <Switch
            id="allowGroupPurchase"
            checked={settings.allowGroupPurchase}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, allowGroupPurchase: checked })
            }
          />
        </div>

        {settings.allowGroupPurchase && (
          <>
            {/* Max Tickets */}
            <div className="space-y-2">
              <Label htmlFor="maxTicketsPerOrder">Max Tickets Per Order</Label>
              <Input
                id="maxTicketsPerOrder"
                type="number"
                min="1"
                max="100"
                value={settings.maxTicketsPerOrder}
                onChange={(e) =>
                  setSettings({ ...settings, maxTicketsPerOrder: parseInt(e.target.value) || 1 })
                }
                className="w-32"
              />
            </div>

            {/* Require Attendee Details */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireAttendeeDetails">Require Attendee Details</Label>
                <p className="text-sm text-muted-foreground">
                  Collect information for each ticket holder
                </p>
              </div>
              <Switch
                id="requireAttendeeDetails"
                checked={settings.requireAttendeeDetails}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireAttendeeDetails: checked })
                }
              />
            </div>

            {settings.requireAttendeeDetails && (
              <div className="ml-4 pl-4 border-l space-y-4">
                {/* Collect Email */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="collectAttendeeEmail">Collect Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email for each attendee
                    </p>
                  </div>
                  <Switch
                    id="collectAttendeeEmail"
                    checked={settings.collectAttendeeEmail}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, collectAttendeeEmail: checked })
                    }
                  />
                </div>

                {/* Collect Phone */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="collectAttendeePhone">Collect Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      Require phone number for each attendee
                    </p>
                  </div>
                  <Switch
                    id="collectAttendeePhone"
                    checked={settings.collectAttendeePhone}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, collectAttendeePhone: checked })
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
