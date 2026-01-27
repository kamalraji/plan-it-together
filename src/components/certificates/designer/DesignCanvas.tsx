import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Rect, Textbox, Circle, Line, FabricObject, FabricImage } from 'fabric';
import { CertificateTemplatePreset, CANVAS_WIDTH, CANVAS_HEIGHT } from '../templates';

// QR placeholder sample image (simple gray box with QR text)
const QR_PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
  <rect x="10" y="10" width="25" height="25" fill="#333"/>
  <rect x="65" y="10" width="25" height="25" fill="#333"/>
  <rect x="10" y="65" width="25" height="25" fill="#333"/>
  <rect x="40" y="40" width="20" height="20" fill="#333"/>
  <text x="50" y="95" text-anchor="middle" font-size="8" fill="#666">QR Code</text>
</svg>
`)}`;

export interface DesignCanvasRef {
  canvas: FabricCanvas | null;
  addText: (text: string, options?: Partial<Textbox>) => void;
  addRect: (options?: Partial<Rect>) => void;
  addCircle: (options?: Partial<Circle>) => void;
  addLine: () => void;
  addImage: (url: string, options?: { isBackground?: boolean }) => Promise<void>;
  addQrPlaceholder: () => Promise<void>;
  loadTemplate: (template: CertificateTemplatePreset) => void;
  exportJSON: () => object;
  deleteSelected: () => void;
  clearCanvas: () => void;
}

interface DesignCanvasProps {
  onSelectionChange?: (obj: FabricObject | null) => void;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

export const DesignCanvas = forwardRef<DesignCanvasRef, DesignCanvasProps>(
  ({ onSelectionChange, onCanvasReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);

    useEffect(() => {
      if (!canvasRef.current || fabricRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      // Selection events
      canvas.on('selection:created', (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });
      canvas.on('selection:updated', (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });
      canvas.on('selection:cleared', () => {
        onSelectionChange?.(null);
      });

      fabricRef.current = canvas;
      onCanvasReady?.(canvas);

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
    }, [onSelectionChange, onCanvasReady]);

    const addText = useCallback((text: string, options?: Partial<Textbox>) => {
      if (!fabricRef.current) return;
      const textbox = new Textbox(text, {
        left: 100,
        top: 100,
        width: 300,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        ...options,
      });
      fabricRef.current.add(textbox);
      fabricRef.current.setActiveObject(textbox);
      fabricRef.current.renderAll();
    }, []);

    const addRect = useCallback((options?: Partial<Rect>) => {
      if (!fabricRef.current) return;
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        ...options,
      });
      fabricRef.current.add(rect);
      fabricRef.current.setActiveObject(rect);
      fabricRef.current.renderAll();
    }, []);

    const addCircle = useCallback((options?: Partial<Circle>) => {
      if (!fabricRef.current) return;
      const circle = new Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#8b5cf6',
        stroke: '#6d28d9',
        strokeWidth: 2,
        ...options,
      });
      fabricRef.current.add(circle);
      fabricRef.current.setActiveObject(circle);
      fabricRef.current.renderAll();
    }, []);

    const addLine = useCallback(() => {
      if (!fabricRef.current) return;
      const line = new Line([50, 50, 250, 50], {
        stroke: '#000000',
        strokeWidth: 2,
      });
      fabricRef.current.add(line);
      fabricRef.current.setActiveObject(line);
      fabricRef.current.renderAll();
    }, []);

    const addImage = useCallback(async (url: string, options?: { isBackground?: boolean }) => {
      if (!fabricRef.current) return;
      
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        
        if (options?.isBackground) {
          // Scale to fit canvas as background
          const scaleX = CANVAS_WIDTH / (img.width || 1);
          const scaleY = CANVAS_HEIGHT / (img.height || 1);
          const scale = Math.max(scaleX, scaleY);
          
          img.set({
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true,
          });
          
          // Send to back
          fabricRef.current.add(img);
          fabricRef.current.sendObjectToBack(img);
        } else {
          // Regular image - scale reasonably
          const maxSize = 200;
          const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1), 1);
          
          img.set({
            left: 100,
            top: 100,
            scaleX: scale,
            scaleY: scale,
          });
          
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
        }
        
        fabricRef.current.renderAll();
      } catch (error) {
        console.error('Failed to load image:', error);
        throw error;
      }
    }, []);

    const addQrPlaceholder = useCallback(async () => {
      if (!fabricRef.current) return;
      
      try {
        const img = await FabricImage.fromURL(QR_PLACEHOLDER_SVG, { crossOrigin: 'anonymous' });
        
        img.set({
          left: CANVAS_WIDTH - 130, // Position in bottom-right area
          top: CANVAS_HEIGHT - 130,
          scaleX: 1,
          scaleY: 1,
          // Mark as QR placeholder for export processing
          data: { isQrPlaceholder: true },
        });
        
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.renderAll();
      } catch (error) {
        console.error('Failed to add QR placeholder:', error);
        throw error;
      }
    }, []);

    const loadTemplate = useCallback((template: CertificateTemplatePreset) => {
      if (!fabricRef.current) return;
      fabricRef.current.clear();
      fabricRef.current.loadFromJSON(template.canvasJSON).then(() => {
        fabricRef.current?.renderAll();
      });
    }, []);

    const exportJSON = useCallback(() => {
      if (!fabricRef.current) return {};
      return fabricRef.current.toJSON(); // Include custom data property
    }, []);

    const deleteSelected = useCallback(() => {
      if (!fabricRef.current) return;
      const activeObjects = fabricRef.current.getActiveObjects();
      activeObjects.forEach((obj) => fabricRef.current?.remove(obj));
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }, []);

    const clearCanvas = useCallback(() => {
      if (!fabricRef.current) return;
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = '#ffffff';
      fabricRef.current.renderAll();
    }, []);

    useImperativeHandle(ref, () => ({
      canvas: fabricRef.current,
      addText,
      addRect,
      addCircle,
      addLine,
      addImage,
      addQrPlaceholder,
      loadTemplate,
      exportJSON,
      deleteSelected,
      clearCanvas,
    }));

    return (
      <div className="flex items-center justify-center bg-muted/30 p-8 rounded-lg overflow-auto">
        <div className="shadow-2xl border border-border rounded-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);

DesignCanvas.displayName = 'DesignCanvas';
