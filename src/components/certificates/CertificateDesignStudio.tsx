import { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { DesignCanvas, DesignCanvasRef } from './designer/DesignCanvas';
import { DesignToolbar } from './designer/DesignToolbar';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { TemplateGallery } from './designer/TemplateGallery';
import { CertificateTemplatePreset } from './templates';
import { downloadCertificatePDF, downloadCertificatePNG } from '@/lib/certificate-pdf';
import { toast } from 'sonner';
import {
  Save,
  Download,
  FileImage,
  X,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CertificateDesignStudioProps {
  initialData?: object;
  onSave: (data: { canvasJSON: object; name: string }) => void;
  onCancel: () => void;
  templateName?: string;
  workspaceId: string;
}

export function CertificateDesignStudio({
  initialData,
  onSave,
  onCancel,
  templateName = 'Untitled Template',
  workspaceId,
}: CertificateDesignStudioProps) {
  const canvasRef = useRef<DesignCanvasRef>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [name, setName] = useState(templateName);

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
    if (initialData) {
      canvas.loadFromJSON(initialData).then(() => canvas.renderAll());
    }
  }, [initialData]);

  const handleSelectTemplate = (template: CertificateTemplatePreset) => {
    canvasRef.current?.loadTemplate(template);
    setGalleryOpen(false);
    toast.success(`Loaded "${template.name}" template`);
  };

  const handleLoadAIDesign = (canvasJSON: object) => {
    if (fabricCanvas) {
      fabricCanvas.loadFromJSON(canvasJSON).then(() => fabricCanvas.renderAll());
      toast.success('AI-generated design loaded!');
    }
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

  const handleExportPDF = async () => {
    if (!fabricCanvas) return;
    setIsExporting(true);
    try {
      await downloadCertificatePDF(fabricCanvas, {
        format: 'A4',
        orientation: 'landscape',
        quality: 'high',
        filename: `${name}-sample.pdf`,
      });
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = () => {
    if (!fabricCanvas) return;
    downloadCertificatePNG(fabricCanvas, `${name}-sample.png`, 'high');
    toast.success('PNG downloaded');
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
          <Button variant="outline" size="sm" onClick={() => setGalleryOpen(true)}>
            Templates
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPNG}>
                <FileImage className="h-4 w-4 mr-2" />
                Download PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
        <DesignToolbar
          onAddText={(text) => canvasRef.current?.addText(text)}
          onAddRect={() => canvasRef.current?.addRect()}
          onAddCircle={() => canvasRef.current?.addCircle()}
          onAddLine={() => canvasRef.current?.addLine()}
          onOpenGallery={() => setGalleryOpen(true)}
          onDeleteSelected={() => canvasRef.current?.deleteSelected()}
          onClearCanvas={() => canvasRef.current?.clearCanvas()}
          onLoadAIDesign={handleLoadAIDesign}
          workspaceId={workspaceId}
        />

        {/* Canvas area */}
        <div className="flex-1 overflow-auto">
          <DesignCanvas
            ref={canvasRef}
            onSelectionChange={setSelectedObject}
            onCanvasReady={handleCanvasReady}
          />
        </div>

        {/* Right properties panel */}
        <PropertiesPanel selectedObject={selectedObject} onUpdate={handleUpdate} />
      </div>

      {/* Template gallery modal */}
      <TemplateGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );

  // Render via portal to ensure full-screen overlay works regardless of parent container
  return createPortal(studioContent, document.body);
}
