import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type,
  Square,
  Circle,
  Minus,
  LayoutTemplate,
  Trash2,
  QrCode,
  User,
} from 'lucide-react';
import { getIDCardPlaceholdersByCategory } from '../templates';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface IDCardToolbarProps {
  onAddText: (text: string) => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onAddQrPlaceholder: () => Promise<void>;
  onAddPhotoPlaceholder: () => Promise<void>;
  onOpenGallery: () => void;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
}

export function IDCardToolbar({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddLine,
  onAddQrPlaceholder,
  onAddPhotoPlaceholder,
  onOpenGallery,
  onDeleteSelected,
  onClearCanvas,
}: IDCardToolbarProps) {
  const placeholdersByCategory = getIDCardPlaceholdersByCategory();

  const categoryLabels: Record<string, string> = {
    attendee: '👤 Attendee',
    event: '📅 Event',
    media: '📷 Media',
  };

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Design Tools</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Templates */}
          <div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
              onClick={onOpenGallery}
            >
              <LayoutTemplate className="h-4 w-4" />
              Template Gallery
            </Button>
          </div>

          <Separator />

          {/* Elements */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Elements</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 h-8 text-xs"
                onClick={() => onAddText('Text')}
              >
                <Type className="h-3.5 w-3.5" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 h-8 text-xs"
                onClick={onAddRect}
              >
                <Square className="h-3.5 w-3.5" />
                Rect
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 h-8 text-xs"
                onClick={onAddCircle}
              >
                <Circle className="h-3.5 w-3.5" />
                Circle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 h-8 text-xs"
                onClick={onAddLine}
              >
                <Minus className="h-3.5 w-3.5" />
                Line
              </Button>
            </div>
          </div>

          <Separator />

          {/* Media Placeholders */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Media</h4>
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={onAddPhotoPlaceholder}
              >
                <User className="h-3.5 w-3.5" />
                Photo Placeholder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={onAddQrPlaceholder}
              >
                <QrCode className="h-3.5 w-3.5" />
                QR Code
              </Button>
            </div>
          </div>

          <Separator />

          {/* Placeholders */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Placeholders</h4>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(placeholdersByCategory)
                .filter(([cat]) => cat !== 'media') // Media handled above
                .map(([category, placeholders]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-xs py-2">
                      {categoryLabels[category] || category}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {placeholders.map((placeholder) => (
                          <Button
                            key={placeholder.key}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7"
                            onClick={() => onAddText(placeholder.key)}
                            title={placeholder.description}
                          >
                            {placeholder.label}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive h-8 text-xs"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground h-8 text-xs"
              onClick={onClearCanvas}
            >
              Clear Canvas
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
