import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AccessibilityIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';

interface AccessibilitySettings {
  features: string[];
  notes: string;
  language: string;
  ageRestriction: {
    enabled: boolean;
    minAge: number | null;
    maxAge: number | null;
  };
}

interface AccessibilitySettingsCardProps {
  eventId: string;
  branding: Record<string, any>;
  onUpdate: () => void;
}

const ACCESSIBILITY_FEATURES = [
  { id: 'wheelchair', label: 'Wheelchair Accessible' },
  { id: 'parking', label: 'Accessible Parking' },
  { id: 'sign_language', label: 'Sign Language Interpreter' },
  { id: 'hearing_loop', label: 'Hearing Loop Available' },
  { id: 'braille', label: 'Braille Materials' },
  { id: 'service_animals', label: 'Service Animals Welcome' },
  { id: 'quiet_room', label: 'Quiet Room Available' },
  { id: 'live_captions', label: 'Live Captions' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mr', label: 'Marathi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
];

export const AccessibilitySettingsCard: React.FC<AccessibilitySettingsCardProps> = ({
  eventId,
  branding,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings: AccessibilitySettings = {
    features: [],
    notes: '',
    language: 'en',
    ageRestriction: {
      enabled: false,
      minAge: null,
      maxAge: null,
    },
  };

  const [settings, setSettings] = useState<AccessibilitySettings>(() => ({
    ...defaultSettings,
    // Try canonical location first, fall back to venue accessibility
    features: branding?.accessibility?.features ?? branding?.venue?.accessibilityFeatures ?? [],
    notes: branding?.accessibility?.notes ?? branding?.venue?.accessibilityNotes ?? '',
    language: branding?.accessibility?.language ?? 'en',
    ageRestriction: branding?.accessibility?.ageRestriction ?? {
      enabled: false,
      minAge: null,
      maxAge: null,
    },
  }));

  useEffect(() => {
    setSettings({
      ...defaultSettings,
      // Try canonical location first, fall back to venue accessibility
      features: branding?.accessibility?.features ?? branding?.venue?.accessibilityFeatures ?? [],
      notes: branding?.accessibility?.notes ?? branding?.venue?.accessibilityNotes ?? '',
      language: branding?.accessibility?.language ?? 'en',
      ageRestriction: branding?.accessibility?.ageRestriction ?? {
        enabled: false,
        minAge: null,
        maxAge: null,
      },
    });
  }, [branding]);

  const toggleFeature = (featureId: string) => {
    setSettings((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f) => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedBranding = {
        ...branding,
        // Save to canonical location (accessibility)
        accessibility: settings,
        // Also sync to venue for backwards compatibility (just features and notes)
        venue: {
          ...branding?.venue,
          accessibilityFeatures: settings.features,
          accessibilityNotes: settings.notes,
        },
      };

      const { error } = await supabase
        .from('events')
        .update({ branding: updatedBranding })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Accessibility settings have been updated.',
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
            <AccessibilityIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Accessibility & Requirements</CardTitle>
            <CardDescription>Configure accessibility features and requirements</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accessibility Features */}
        <div className="space-y-3">
          <Label>Accessibility Features</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCESSIBILITY_FEATURES.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={settings.features.includes(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                />
                <label
                  htmlFor={feature.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {feature.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Notes */}
        <div className="space-y-2">
          <Label htmlFor="accessibilityNotes">Additional Accessibility Information</Label>
          <Textarea
            id="accessibilityNotes"
            placeholder="e.g., North entrance has ramp access, elevator available on ground floor..."
            value={settings.notes}
            onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Event Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Event Language</Label>
          <Select
            value={settings.language}
            onValueChange={(value) => setSettings({ ...settings, language: value })}
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age Restriction */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <p className="text-sm text-muted-foreground">
                Set minimum or maximum age requirements
              </p>
            </div>
            <Switch
              id="ageRestriction"
              checked={settings.ageRestriction.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  ageRestriction: {
                    ...settings.ageRestriction,
                    enabled: checked,
                    minAge: checked ? settings.ageRestriction.minAge : null,
                    maxAge: checked ? settings.ageRestriction.maxAge : null,
                  },
                })
              }
            />
          </div>

          {settings.ageRestriction.enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="minAge">Minimum Age</Label>
                <Input
                  id="minAge"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="No minimum"
                  value={settings.ageRestriction.minAge || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ageRestriction: {
                        ...settings.ageRestriction,
                        minAge: parseInt(e.target.value) || null,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAge">Maximum Age</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="No maximum"
                  value={settings.ageRestriction.maxAge || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ageRestriction: {
                        ...settings.ageRestriction,
                        maxAge: parseInt(e.target.value) || null,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
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
  );
};
