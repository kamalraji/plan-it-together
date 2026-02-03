import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, X, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  CertificateTemplate, 
  CertificateTemplateBranding, 
  CertificateTemplateContent,
  CreateTemplateInput,
  UpdateTemplateInput 
} from '@/hooks/useCertificateTemplates';

interface CertificateTemplateDesignerProps {
  workspaceId: string;
  template?: CertificateTemplate | null;
  onSave: (template: CreateTemplateInput | UpdateTemplateInput) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const FONT_OPTIONS = [
  { value: 'serif', label: 'Serif (Classic)' },
  { value: 'sans-serif', label: 'Sans Serif (Modern)' },
  { value: 'cursive', label: 'Script (Elegant)' },
];

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
];

const BORDER_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'simple', label: 'Simple' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'ornate', label: 'Ornate' },
];

export function CertificateTemplateDesigner({
  workspaceId,
  template,
  onSave,
  onCancel,
  isSaving = false,
}: CertificateTemplateDesignerProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState<'COMPLETION' | 'MERIT' | 'APPRECIATION'>(template?.type ?? 'COMPLETION');
  const [isDefault, setIsDefault] = useState(template?.is_default ?? false);
  
  const [branding, setBranding] = useState<CertificateTemplateBranding>({
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    fontFamily: 'serif',
    borderStyle: 'elegant',
    layout: 'classic',
    ...template?.branding,
  });

  const [content, setContent] = useState<CertificateTemplateContent>({
    title: 'Certificate of Completion',
    subtitle: 'This certifies that',
    bodyText: 'has successfully completed all requirements for',
    footerText: 'Issued on {date}',
    signatureName: '',
    signatureTitle: '',
    ...template?.content,
  });

  const [backgroundUrl, setBackgroundUrl] = useState(template?.background_url ?? '');
  const [logoUrl, setLogoUrl] = useState(template?.logo_url ?? '');
  const [signatureUrl, setSignatureUrl] = useState(template?.signature_url ?? '');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setIsDefault(template.is_default);
      setBranding({ ...branding, ...template.branding });
      setContent({ ...content, ...template.content });
      setBackgroundUrl(template.background_url ?? '');
      setLogoUrl(template.logo_url ?? '');
      setSignatureUrl(template.signature_url ?? '');
    }
  }, [template]);

  const handleFileUpload = async (file: File, type: 'background' | 'logo' | 'signature') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${workspaceId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-assets')
        .getPublicUrl(fileName);

      switch (type) {
        case 'background':
          setBackgroundUrl(publicUrl);
          break;
        case 'logo':
          setLogoUrl(publicUrl);
          break;
        case 'signature':
          setSignatureUrl(publicUrl);
          break;
      }

      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const templateData: CreateTemplateInput = {
      name: name.trim(),
      type,
      backgroundUrl: backgroundUrl || undefined,
      logoUrl: logoUrl || undefined,
      signatureUrl: signatureUrl || undefined,
      branding,
      content,
      isDefault,
    };

    onSave(templateData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings Panel */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Template Details</h3>
          
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Event Completion Certificate"
            />
          </div>

          <div className="space-y-2">
            <Label>Certificate Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETION">Completion</SelectItem>
                <SelectItem value="MERIT">Merit</SelectItem>
                <SelectItem value="APPRECIATION">Appreciation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(!!checked)}
            />
            <Label htmlFor="isDefault">Set as default for this type</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Branding</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  placeholder="#4F46E5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Style</Label>
              <Select
                value={branding.fontFamily}
                onValueChange={(v) => setBranding({ ...branding, fontFamily: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={branding.layout}
                onValueChange={(v) => setBranding({ ...branding, layout: v as typeof branding.layout })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Border Style</Label>
            <Select
              value={branding.borderStyle}
              onValueChange={(v) => setBranding({ ...branding, borderStyle: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BORDER_STYLES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Assets</h3>
          
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto rounded" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Signature Upload */}
          <div className="space-y-2">
            <Label>Signature Image</Label>
            <div className="flex items-center gap-2">
              {signatureUrl ? (
                <div className="relative">
                  <img src={signatureUrl} alt="Signature" className="h-12 w-auto rounded" />
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('')}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'signature')}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Background Upload */}
          <div className="space-y-2">
            <Label>Background Image (optional)</Label>
            <div className="flex items-center gap-2">
              {backgroundUrl ? (
                <div className="relative">
                  <img src={backgroundUrl} alt="Background" className="h-12 w-auto rounded" />
                  <button
                    type="button"
                    onClick={() => setBackgroundUrl('')}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Background</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'background')}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Content</h3>
          
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              placeholder="Certificate of Completion"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={content.subtitle}
              onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
              placeholder="This certifies that"
            />
          </div>

          <div className="space-y-2">
            <Label>Body Text</Label>
            <Textarea
              value={content.bodyText}
              onChange={(e) => setContent({ ...content, bodyText: e.target.value })}
              placeholder="has successfully completed all requirements for"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Footer Text</Label>
            <Input
              value={content.footerText}
              onChange={(e) => setContent({ ...content, footerText: e.target.value })}
              placeholder="Issued on {date}"
            />
            <p className="text-xs text-muted-foreground">Use {'{date}'} as placeholder for issue date</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Signatory Name</Label>
              <Input
                value={content.signatureName}
                onChange={(e) => setContent({ ...content, signatureName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Signatory Title</Label>
              <Input
                value={content.signatureTitle}
                onChange={(e) => setContent({ ...content, signatureTitle: e.target.value })}
                placeholder="Event Director"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="sticky top-4">
        <h3 className="font-semibold mb-4">Live Preview</h3>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <CertificatePreview
              branding={branding}
              content={content}
              logoUrl={logoUrl}
              signatureUrl={signatureUrl}
              backgroundUrl={backgroundUrl}
              type={type}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Preview Component
function CertificatePreview({
  branding,
  content,
  logoUrl,
  signatureUrl,
  backgroundUrl,
  type,
}: {
  branding: CertificateTemplateBranding;
  content: CertificateTemplateContent;
  logoUrl: string;
  signatureUrl: string;
  backgroundUrl: string;
  type: string;
}) {
  const getBorderClass = () => {
    switch (branding.borderStyle) {
      case 'simple':
        return 'border-4';
      case 'elegant':
        return 'border-8 border-double';
      case 'ornate':
        return 'border-8 border-double shadow-lg';
      default:
        return '';
    }
  };

  const getLayoutClass = () => {
    switch (branding.layout) {
      case 'modern':
        return 'text-left';
      case 'minimal':
        return 'text-center py-8';
      default:
        return 'text-center py-12';
    }
  };

  return (
    <div
      className={`aspect-[1.414/1] p-8 ${getBorderClass()} ${getLayoutClass()}`}
      style={{
        fontFamily: branding.fontFamily,
        borderColor: branding.primaryColor,
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: backgroundUrl ? undefined : '#fefefe',
      }}
    >
      <div className="h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-16 w-auto" />
          )}
          <h1
            className="text-2xl font-bold"
            style={{ color: branding.primaryColor }}
          >
            {content.title || 'Certificate of Completion'}
          </h1>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-muted-foreground text-sm">
            {content.subtitle || 'This certifies that'}
          </p>
          <p
            className="text-xl font-semibold border-b-2 pb-1 px-4"
            style={{ borderColor: branding.secondaryColor }}
          >
            [Recipient Name]
          </p>
          <p className="text-muted-foreground text-sm max-w-[80%]">
            {content.bodyText || 'has successfully completed all requirements for'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Award className="h-5 w-5" style={{ color: branding.primaryColor }} />
            <span className="font-medium" style={{ color: branding.primaryColor }}>
              {type} Certificate
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col items-center gap-2">
            {signatureUrl && (
              <img src={signatureUrl} alt="Signature" className="h-10 w-auto" />
            )}
            <div className="border-t pt-1" style={{ borderColor: branding.secondaryColor }}>
              <p className="text-sm font-medium">{content.signatureName || 'Signature'}</p>
              <p className="text-xs text-muted-foreground">{content.signatureTitle || 'Title'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {(content.footerText || 'Issued on {date}').replace('{date}', new Date().toLocaleDateString())}
          </p>
        </div>
      </div>
    </div>
  );
}
