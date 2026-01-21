import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, SearchIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';
import { TagInputWithAutocomplete } from '@/components/ui/tag-input-autocomplete';

interface SEOSettings {
  tags: string[];
  metaDescription: string;
  customSlug: string;
}

interface SEOSettingsCardProps {
  eventId: string;
  branding: Record<string, any>;
  eventName: string;
  onUpdate: () => void;
}

export const SEOSettingsCard: React.FC<SEOSettingsCardProps> = ({
  eventId,
  branding,
  eventName,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings: SEOSettings = {
    tags: [],
    metaDescription: '',
    customSlug: '',
  };

  const [settings, setSettings] = useState<SEOSettings>(() => ({
    ...defaultSettings,
    // Try canonical location first, fall back to legacy location
    tags: branding?.seo?.tags ?? branding?.tags ?? [],
    metaDescription: branding?.seo?.metaDescription ?? '',
    customSlug: branding?.seo?.customSlug ?? '',
  }));

  useEffect(() => {
    setSettings({
      ...defaultSettings,
      // Try canonical location first, fall back to legacy location
      tags: branding?.seo?.tags ?? branding?.tags ?? [],
      metaDescription: branding?.seo?.metaDescription ?? '',
      customSlug: branding?.seo?.customSlug ?? '',
    });
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedBranding = {
        ...branding,
        // Save to canonical location (seo)
        seo: settings,
        // Also save to legacy location for backwards compatibility
        tags: settings.tags,
      };

      const { error } = await supabase
        .from('events')
        .update({ branding: updatedBranding })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'SEO settings have been updated.',
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

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  const previewSlug = settings.customSlug || slugify(eventName);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <SearchIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">SEO & Discovery</CardTitle>
            <CardDescription>Optimize event visibility in search results</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tags with Autocomplete */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tags</Label>
            <span className="text-xs text-muted-foreground">{settings.tags.length}/10</span>
          </div>
          <TagInputWithAutocomplete
            eventId={eventId}
            tags={settings.tags}
            onTagsChange={(newTags) => setSettings({ ...settings, tags: newTags })}
            maxTags={10}
            placeholder="Type to search or add new tags..."
          />
          <p className="text-xs text-muted-foreground">
            Add keywords to help people discover your event. Suggestions based on other events in your organization.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <span className="text-xs text-muted-foreground">
              {settings.metaDescription.length}/160
            </span>
          </div>
          <Textarea
            id="metaDescription"
            placeholder="A brief description of your event for search engines..."
            value={settings.metaDescription}
            onChange={(e) => {
              if (e.target.value.length <= 160) {
                setSettings({ ...settings, metaDescription: e.target.value });
              }
            }}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This appears in search engine results
          </p>
        </div>

        {/* Custom URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="customSlug">Custom URL Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/events/</span>
            <Input
              id="customSlug"
              placeholder={slugify(eventName)}
              value={settings.customSlug}
              onChange={(e) => setSettings({ ...settings, customSlug: slugify(e.target.value) })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: <code className="bg-muted px-1 rounded">/events/{previewSlug}</code>
          </p>
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
