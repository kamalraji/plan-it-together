import { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { IDCardCanvas, IDCardCanvasRef } from './designer/IDCardCanvas';
import { IDCardToolbar } from './designer/IDCardToolbar';
import { IDCardTemplateGallery } from './designer/IDCardTemplateGallery';
import { IDCardPreviewPanel } from './designer/IDCardPreviewPanel';
import { PropertiesPanel } from '@/components/certificates/designer/PropertiesPanel';
import { IDCardTemplatePreset } from './templates';
import { toast } from 'sonner';
import {
  Save,
  X,
  Loader2,
  Eye,
} from 'lucide-react';

interface IDCardDesignStudioProps {
  initialData?: object;
  onSave: (data: { canvasJSON: object; name: string }) => void;
  onCancel: () => void;
  templateName?: string;
  workspaceId: string;
  eventId?: string;
}

export function IDCardDesignStudio({
  initialData,
  onSave,
  onCancel,
  templateName = 'Untitled Template',
}: IDCardDesignStudioProps) {
  const canvasRef = useRef<IDCardCanvasRef>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(!initialData);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(templateName);

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
    if (initialData) {
      canvas.loadFromJSON(initialData).then(() => canvas.renderAll());
    }
  }, [initialData]);

  const handleSelectTemplate = (template: IDCardTemplatePreset) => {
    canvasRef.current?.loadTemplate(template);
    setGalleryOpen(false);
    toast.success(`Loaded "${template.name}" template`);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const canvasJSON = canvasRef.current.exportJSON();
      onSave({ canvasJSON, name });
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = () => {
    fabricCanvas?.renderAll();
  };

  const studioContent = (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button variant="outline" size="sm" onClick={() => setGalleryOpen(true)}>
            Templates
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <IDCardToolbar
          onAddText={(text) => canvasRef.current?.addText(text)}
          onAddRect={() => canvasRef.current?.addRect()}
          onAddCircle={() => canvasRef.current?.addCircle()}
          onAddLine={() => canvasRef.current?.addLine()}
          onAddQrPlaceholder={() => canvasRef.current?.addQrPlaceholder() || Promise.resolve()}
          onAddPhotoPlaceholder={() => canvasRef.current?.addPhotoPlaceholder() || Promise.resolve()}
          onOpenGallery={() => setGalleryOpen(true)}
          onDeleteSelected={() => canvasRef.current?.deleteSelected()}
          onClearCanvas={() => canvasRef.current?.clearCanvas()}
        />

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <IDCardCanvas
            ref={canvasRef}
            onSelectionChange={setSelectedObject}
            onCanvasReady={handleCanvasReady}
          />
        </div>

        {/* Right properties panel */}
        <PropertiesPanel selectedObject={selectedObject} onUpdate={handleUpdate} />
      </div>

      {/* Template gallery modal */}
      <IDCardTemplateGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Preview panel */}
      <IDCardPreviewPanel
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sourceCanvas={fabricCanvas}
      />
    </div>
  );

  // Render via portal for full-screen overlay
  return createPortal(studioContent, document.body);
}
