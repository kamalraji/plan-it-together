import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CERTIFICATE_TEMPLATES, CertificateTemplatePreset } from '../templates';
import { Check, FileText } from 'lucide-react';

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: CertificateTemplatePreset) => void;
  selectedTemplateId?: string;
}

const categoryLabels: Record<string, string> = {
  formal: 'Formal',
  modern: 'Modern',
  minimal: 'Minimal',
  creative: 'Creative',
};

export function TemplateGallery({
  open,
  onOpenChange,
  onSelectTemplate,
  selectedTemplateId,
}: TemplateGalleryProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const filteredTemplates = filter
    ? CERTIFICATE_TEMPLATES.filter((t) => t.category === filter)
    : CERTIFICATE_TEMPLATES;

  const categories = [...new Set(CERTIFICATE_TEMPLATES.map((t) => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Gallery
          </DialogTitle>
        </DialogHeader>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  hover:border-primary hover:shadow-md
                  ${selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                  }
                `}
              >
                {selectedTemplateId === template.id && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="h-24 bg-muted rounded flex items-center justify-center text-4xl mb-3">
                  {template.thumbnail}
                </div>

                {/* Info */}
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {categoryLabels[template.category] || template.category}
                </Badge>
              </button>
            ))}

            {/* Blank template option */}
            <button
              onClick={() => onSelectTemplate({
                id: 'blank',
                name: 'Blank',
                description: 'Start from scratch',
                thumbnail: '➕',
                category: 'minimal',
                dimensions: { width: 842, height: 595 },
                canvasJSON: { version: '6.0.0', objects: [] },
              })}
              className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-all text-left"
            >
              <div className="h-24 bg-muted/50 rounded flex items-center justify-center text-4xl mb-3">
                ➕
              </div>
              <h3 className="font-semibold text-foreground">Blank Canvas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start with an empty canvas
              </p>
            </button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
