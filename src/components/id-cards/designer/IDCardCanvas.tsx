import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Textbox, Circle, Line, FabricObject, FabricImage } from 'fabric';
import { IDCardTemplatePreset, IDCardOrientation, getIDCardDimensions } from '../templates';

// QR placeholder sample image
const QR_PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <rect width="50" height="50" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="5" y="5" width="12" height="12" fill="#333"/>
  <rect x="33" y="5" width="12" height="12" fill="#333"/>
  <rect x="5" y="33" width="12" height="12" fill="#333"/>
  <rect x="20" y="20" width="10" height="10" fill="#333"/>
  <text x="25" y="48" text-anchor="middle" font-size="5" fill="#94a3b8">QR</text>
</svg>
`)}`;

// Photo placeholder image
const PHOTO_PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg width="70" height="85" viewBox="0 0 70 85" xmlns="http://www.w3.org/2000/svg">
  <rect width="70" height="85" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" rx="4"/>
  <circle cx="35" cy="32" r="18" fill="#cbd5e1"/>
  <ellipse cx="35" cy="75" rx="25" ry="18" fill="#cbd5e1"/>
  <text x="35" y="55" text-anchor="middle" font-size="8" fill="#94a3b8">Photo</text>
</svg>
`)}`;

export interface IDCardCanvasRef {
  canvas: FabricCanvas | null;
  addText: (text: string, options?: Partial<Textbox>) => void;
  addRect: (options?: Partial<Rect>) => void;
  addCircle: (options?: Partial<Circle>) => void;
  addLine: () => void;
  addImage: (url: string, options?: { isBackground?: boolean }) => Promise<void>;
  addQrPlaceholder: () => Promise<void>;
  addPhotoPlaceholder: () => Promise<void>;
  loadTemplate: (template: IDCardTemplatePreset) => void;
  exportJSON: () => object;
  deleteSelected: () => void;
  clearCanvas: () => void;
  setOrientation: (orientation: IDCardOrientation) => void;
}

interface IDCardCanvasProps {
  orientation?: IDCardOrientation;
  onSelectionChange?: (obj: FabricObject | null) => void;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

export const IDCardCanvas = forwardRef<IDCardCanvasRef, IDCardCanvasProps>(
  ({ orientation = 'landscape', onSelectionChange, onCanvasReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [scale, setScale] = useState(1);

    // Calculate responsive scale based on container size
    useEffect(() => {
      const updateScale = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const padding = 64; // 32px padding on each side
        const availableWidth = container.clientWidth - padding;
        const availableHeight = container.clientHeight - padding;

        const { width, height } = getIDCardDimensions(orientation);

        const scaleX = availableWidth / width;
        const scaleY = availableHeight / height;
        const newScale = Math.min(scaleX, scaleY, 2.5); // Max 2.5x zoom

        setScale(Math.max(0.5, newScale)); // Min 0.5x
      };

      updateScale();
      
      // Use ResizeObserver for more reliable container size tracking
      const resizeObserver = new ResizeObserver(updateScale);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', updateScale);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateScale);
      };
    }, [orientation]);

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current || fabricRef.current) return;

      const { width, height } = getIDCardDimensions(orientation);

      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
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

    // Update canvas dimensions when orientation changes
    useEffect(() => {
      if (!fabricRef.current) return;
      const { width, height } = getIDCardDimensions(orientation);
      fabricRef.current.setDimensions({ width, height });
      fabricRef.current.renderAll();
    }, [orientation]);

    const getCurrentDimensions = useCallback(() => {
      return getIDCardDimensions(orientation);
    }, [orientation]);

    const addText = useCallback((text: string, options?: Partial<Textbox>) => {
      if (!fabricRef.current) return;
      const textbox = new Textbox(text, {
        left: 50,
        top: 50,
        width: 150,
        fontSize: 14,
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
        left: 50,
        top: 50,
        width: 80,
        height: 50,
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        ...options,
      });
      fabricRef.current.add(rect);
      fabricRef.current.setActiveObject(rect);
      fabricRef.current.renderAll();
    }, []);

    const addCircle = useCallback((options?: Partial<Circle>) => {
      if (!fabricRef.current) return;
      const circle = new Circle({
        left: 50,
        top: 50,
        radius: 25,
        fill: '#8b5cf6',
        stroke: '#6d28d9',
        strokeWidth: 1,
        ...options,
      });
      fabricRef.current.add(circle);
      fabricRef.current.setActiveObject(circle);
      fabricRef.current.renderAll();
    }, []);

    const addLine = useCallback(() => {
      if (!fabricRef.current) return;
      const line = new Line([20, 20, 120, 20], {
        stroke: '#000000',
        strokeWidth: 2,
      });
      fabricRef.current.add(line);
      fabricRef.current.setActiveObject(line);
      fabricRef.current.renderAll();
    }, []);

    const addImage = useCallback(async (url: string, options?: { isBackground?: boolean }) => {
      if (!fabricRef.current) return;
      const { width: canvasWidth, height: canvasHeight } = getCurrentDimensions();
      
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        
        if (options?.isBackground) {
          // Scale to fit canvas as background
          const scaleX = canvasWidth / (img.width || 1);
          const scaleY = canvasHeight / (img.height || 1);
          const imgScale = Math.max(scaleX, scaleY);
          
          img.set({
            left: 0,
            top: 0,
            scaleX: imgScale,
            scaleY: imgScale,
            selectable: true,
            evented: true,
          });
          
          fabricRef.current.add(img);
          fabricRef.current.sendObjectToBack(img);
        } else {
          // Regular image - scale to reasonable size for ID card
          const maxSize = 80;
          const imgScale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1), 1);
          
          img.set({
            left: 50,
            top: 50,
            scaleX: imgScale,
            scaleY: imgScale,
          });
          
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
        }
        
        fabricRef.current.renderAll();
      } catch (error) {
        console.error('Failed to load image:', error);
        throw error;
      }
    }, [getCurrentDimensions]);

    const addQrPlaceholder = useCallback(async () => {
      if (!fabricRef.current) return;
      const { width: canvasWidth, height: canvasHeight } = getCurrentDimensions();
      
      try {
        const img = await FabricImage.fromURL(QR_PLACEHOLDER_SVG, { crossOrigin: 'anonymous' });
        
        img.set({
          left: canvasWidth - 60,
          top: canvasHeight - 60,
          scaleX: 1,
          scaleY: 1,
          data: { isQrPlaceholder: true },
        });
        
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.renderAll();
      } catch (error) {
        console.error('Failed to add QR placeholder:', error);
        throw error;
      }
    }, [getCurrentDimensions]);

    const addPhotoPlaceholder = useCallback(async () => {
      if (!fabricRef.current) return;
      
      try {
        const img = await FabricImage.fromURL(PHOTO_PLACEHOLDER_SVG, { crossOrigin: 'anonymous' });
        
        img.set({
          left: 15,
          top: 60,
          scaleX: 1,
          scaleY: 1,
          data: { isPhotoPlaceholder: true },
        });
        
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.renderAll();
      } catch (error) {
        console.error('Failed to add photo placeholder:', error);
        throw error;
      }
    }, []);

    const loadTemplate = useCallback((template: IDCardTemplatePreset) => {
      if (!fabricRef.current) return;
      fabricRef.current.clear();
      fabricRef.current.loadFromJSON(template.canvasJSON).then(() => {
        fabricRef.current?.renderAll();
      });
    }, []);

    const exportJSON = useCallback(() => {
      if (!fabricRef.current) return {};
      return fabricRef.current.toJSON();
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

    const setOrientation = useCallback((newOrientation: IDCardOrientation) => {
      if (!fabricRef.current) return;
      const { width, height } = getIDCardDimensions(newOrientation);
      fabricRef.current.setDimensions({ width, height });
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
      addPhotoPlaceholder,
      loadTemplate,
      exportJSON,
      deleteSelected,
      clearCanvas,
      setOrientation,
    }));

    return (
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-muted/30 overflow-hidden w-full h-full"
      >
        <div 
          className="shadow-2xl border border-border rounded-lg overflow-hidden bg-white"
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);

IDCardCanvas.displayName = 'IDCardCanvas';
