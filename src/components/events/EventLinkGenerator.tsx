import { useState, useMemo } from 'react';
import { Copy, Check, Link2, Share2, Mail, MessageCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EventLinkGeneratorProps {
  eventSlug: string;
  eventName: string;
}

interface UTMPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  source: string;
  medium: string;
  campaign: string;
}

const UTM_PRESETS: UTMPreset[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: <Share2 className="h-4 w-4" />,
    source: 'linkedin',
    medium: 'social',
    campaign: 'event-promotion',
  },
  {
    id: 'twitter',
    label: 'Twitter/X',
    icon: <Share2 className="h-4 w-4" />,
    source: 'twitter',
    medium: 'social',
    campaign: 'event-promotion',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: <Share2 className="h-4 w-4" />,
    source: 'facebook',
    medium: 'social',
    campaign: 'event-promotion',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Share2 className="h-4 w-4" />,
    source: 'instagram',
    medium: 'social',
    campaign: 'event-promotion',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="h-4 w-4" />,
    source: 'newsletter',
    medium: 'email',
    campaign: 'event-invite',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle className="h-4 w-4" />,
    source: 'whatsapp',
    medium: 'messaging',
    campaign: 'event-share',
  },
  {
    id: 'ads',
    label: 'Paid Ads',
    icon: <Megaphone className="h-4 w-4" />,
    source: 'google',
    medium: 'cpc',
    campaign: 'event-ads',
  },
];

const SECTION_OPTIONS = [
  { id: '', label: 'Top of page' },
  { id: 'about', label: 'About section' },
  { id: 'details', label: 'Event details' },
  { id: 'register', label: 'Registration' },
  { id: 'organizer', label: 'Organizer info' },
];

export function EventLinkGenerator({ eventSlug, eventName }: EventLinkGeneratorProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customSource, setCustomSource] = useState('');
  const [customMedium, setCustomMedium] = useState('');
  const [customCampaign, setCustomCampaign] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const baseUrl = useMemo(() => {
    return `${window.location.origin}/event/${eventSlug}`;
  }, [eventSlug]);

  const buildUrl = (source: string, medium: string, campaign: string, section?: string) => {
    const params = new URLSearchParams();
    if (source) params.set('utm_source', source);
    if (medium) params.set('utm_medium', medium);
    if (campaign) params.set('utm_campaign', campaign);
    if (section) params.set('sectionid', section);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const customUrl = useMemo(() => {
    return buildUrl(customSource, customMedium, customCampaign, selectedSection);
  }, [customSource, customMedium, customCampaign, selectedSection, baseUrl]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Shareable Event Links
        </CardTitle>
        <CardDescription>
          Generate trackable links for <span className="font-medium">{eventName}</span> to measure
          marketing performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Quick Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom UTM</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Click a preset to copy a ready-to-use tracking link:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {UTM_PRESETS.map((preset) => {
                const url = buildUrl(preset.source, preset.medium, preset.campaign);
                const isCopied = copiedId === preset.id;
                return (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="justify-between h-auto py-3"
                    onClick={() => copyToClipboard(url, preset.id)}
                  >
                    <span className="flex items-center gap-2">
                      {preset.icon}
                      {preset.label}
                    </span>
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="utm-source">Source</Label>
                <Input
                  id="utm-source"
                  placeholder="e.g., newsletter"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Where the traffic comes from</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-medium">Medium</Label>
                <Input
                  id="utm-medium"
                  placeholder="e.g., email"
                  value={customMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Marketing channel type</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-campaign">Campaign</Label>
                <Input
                  id="utm-campaign"
                  placeholder="e.g., jan-promo"
                  value={customCampaign}
                  onChange={(e) => setCustomCampaign(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Specific campaign name</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deep link to section (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {SECTION_OPTIONS.map((section) => (
                  <Badge
                    key={section.id}
                    variant={selectedSection === section.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedSection(section.id)}
                  >
                    {section.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Generated Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={customUrl}
                  className="font-mono text-xs bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(customUrl, 'custom')}
                >
                  {copiedId === 'custom' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EventLinkGenerator;
