import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignGenerated: (canvasJSON: object) => void;
  workspaceId: string;
}

const CERTIFICATE_TYPES = [
  { value: 'Completion', label: 'Certificate of Completion' },
  { value: 'Achievement', label: 'Certificate of Achievement' },
  { value: 'Participation', label: 'Certificate of Participation' },
  { value: 'Excellence', label: 'Certificate of Excellence' },
  { value: 'Appreciation', label: 'Certificate of Appreciation' },
];

const STYLE_OPTIONS = [
  { value: 'elegant', label: 'Elegant & Classic' },
  { value: 'modern', label: 'Modern & Minimal' },
  { value: 'corporate', label: 'Corporate Professional' },
  { value: 'creative', label: 'Creative & Artistic' },
  { value: 'academic', label: 'Academic & Traditional' },
];

// Validation constants matching backend
const MAX_EVENT_THEME_LENGTH = 200;
const MAX_ADDITIONAL_NOTES_LENGTH = 500;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function AIDesignDialog({ open, onOpenChange, onDesignGenerated, workspaceId }: AIDesignDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    eventTheme: '',
    certificateType: 'Completion',
    primaryColor: '#1a365d',
    secondaryColor: '#c9a227',
    style: 'elegant',
    additionalNotes: '',
  });

  const validateForm = (): string | null => {
    if (!formData.eventTheme.trim()) {
      return 'Please enter an event theme';
    }
    if (formData.eventTheme.length > MAX_EVENT_THEME_LENGTH) {
      return `Event theme must be less than ${MAX_EVENT_THEME_LENGTH} characters`;
    }
    if (!HEX_COLOR_REGEX.test(formData.primaryColor)) {
      return 'Primary color must be a valid hex color';
    }
    if (!HEX_COLOR_REGEX.test(formData.secondaryColor)) {
      return 'Accent color must be a valid hex color';
    }
    if (formData.additionalNotes.length > MAX_ADDITIONAL_NOTES_LENGTH) {
      return `Additional notes must be less than ${MAX_ADDITIONAL_NOTES_LENGTH} characters`;
    }
    return null;
  };

  const getErrorMessage = (status: number, defaultMessage: string): string => {
    switch (status) {
      case 401:
        return 'Please sign in to use AI design';
      case 403:
        return "You don't have permission to design certificates for this workspace";
      case 429:
        return 'Too many requests. Please wait a minute and try again.';
      case 402:
        return 'AI credits exhausted. Please add credits in workspace settings.';
      default:
        return defaultMessage;
    }
  };

  const handleGenerate = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace context is required');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate-design', {
        body: {
          ...formData,
          workspaceId,
        },
      });

      if (error) {
        // Handle FunctionsHttpError with status codes
        const status = (error as any)?.status || 500;
        const message = getErrorMessage(status, error.message || 'Failed to generate design');
        throw new Error(message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.canvasJSON) {
        onDesignGenerated(data.canvasJSON);
        onOpenChange(false);
        toast.success('AI design generated successfully!');
        // Reset form
        setFormData({
          eventTheme: '',
          certificateType: 'Completion',
          primaryColor: '#1a365d',
          secondaryColor: '#c9a227',
          style: 'elegant',
          additionalNotes: '',
        });
      }
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate design');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Certificate Designer
          </DialogTitle>
          <DialogDescription>
            Describe your event and preferences, and AI will generate a custom certificate layout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="eventTheme">
              Event Theme * 
              <span className="text-xs text-muted-foreground ml-2">
                ({formData.eventTheme.length}/{MAX_EVENT_THEME_LENGTH})
              </span>
            </Label>
            <Input
              id="eventTheme"
              placeholder="e.g., Tech Conference 2024, Annual Leadership Summit"
              value={formData.eventTheme}
              onChange={(e) => setFormData({ ...formData, eventTheme: e.target.value.slice(0, MAX_EVENT_THEME_LENGTH) })}
              maxLength={MAX_EVENT_THEME_LENGTH}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificateType">Certificate Type</Label>
              <Select
                value={formData.certificateType}
                onValueChange={(value) => setFormData({ ...formData, certificateType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Design Style</Label>
              <Select
                value={formData.style}
                onValueChange={(value) => setFormData({ ...formData, style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 7) {
                      setFormData({ ...formData, primaryColor: value });
                    }
                  }}
                  className="flex-1"
                  placeholder="#1a365d"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 7) {
                      setFormData({ ...formData, secondaryColor: value });
                    }
                  }}
                  className="flex-1"
                  placeholder="#c9a227"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">
              Additional Notes (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                ({formData.additionalNotes.length}/{MAX_ADDITIONAL_NOTES_LENGTH})
              </span>
            </Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any specific elements, text, or design preferences..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value.slice(0, MAX_ADDITIONAL_NOTES_LENGTH) })}
              rows={3}
              maxLength={MAX_ADDITIONAL_NOTES_LENGTH}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Design
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
