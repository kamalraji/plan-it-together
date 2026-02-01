import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ID_CARD_TEMPLATES, IDCardTemplatePreset, ID_CARD_WIDTH, ID_CARD_HEIGHT } from '../templates';
import { Check, CreditCard } from 'lucide-react';

interface IDCardTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: IDCardTemplatePreset) => void;
  selectedTemplateId?: string;
}

const categoryLabels: Record<string, string> = {
  professional: 'Professional',
  minimal: 'Minimal',
  modern: 'Modern',
  corporate: 'Corporate',
  creative: 'Creative',
};

export function IDCardTemplateGallery({
  open,
  onOpenChange,
  onSelectTemplate,
  selectedTemplateId,
}: IDCardTemplateGalleryProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const filteredTemplates = filter
    ? ID_CARD_TEMPLATES.filter((t) => t.category === filter)
    : ID_CARD_TEMPLATES;

  const categories = [...new Set(ID_CARD_TEMPLATES.map((t) => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            ID Card Templates
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

        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`
                  relative p-3 rounded-lg border-2 transition-all text-left
                  hover:border-primary hover:shadow-md
                  ${selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                  }
                `}
              >
                {selectedTemplateId === template.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="h-16 bg-muted rounded flex items-center justify-center text-3xl mb-2">
                  {template.thumbnail}
                </div>

                {/* Info */}
                <h3 className="font-semibold text-foreground text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {template.description}
                </p>
                <Badge variant="secondary" className="mt-2 text-xs">
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
                dimensions: { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT },
                canvasJSON: { version: '6.0.0', objects: [] },
              })}
              className="p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-all text-left"
            >
              <div className="h-16 bg-muted/50 rounded flex items-center justify-center text-3xl mb-2">
                ➕
              </div>
              <h3 className="font-semibold text-foreground text-sm">Blank Canvas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start with an empty card
              </p>
            </button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
