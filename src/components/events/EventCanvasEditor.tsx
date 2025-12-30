import React, { useEffect, useRef, useState } from 'react';

interface EventCanvasEditorProps {
  value?: any; // data URL string representing the drawing
  onChange?: (snapshot: any) => void;
}

/**
 * Simple, license-free drawing canvas for sketching the event hero.
 * Stores the drawing as a PNG data URL so it can be rendered on the landing page.
 */
export const EventCanvasEditor: React.FC<EventCanvasEditorProps> = ({ value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [brushColor, setBrushColor] = useState<string>('#1f2937');
  const [brushSize, setBrushSize] = useState<number>(4);

  // Load initial image (if any)
  useEffect(() => {
    if (!value || !canvasRef.current || typeof value !== 'string') return;
    if (!value.startsWith('data:image')) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, [value]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as React.MouseEvent).clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    if (!point) return;
    isDrawingRef.current = true;
    lastPointRef.current = point;
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const lastPoint = lastPointRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !ctx || !lastPoint || !point) return;

    event.preventDefault();

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  };

  const endDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas || !onChange) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) {
      onChange(null);
    }
  };

  const presetColors = ['#111827', '#1f2937', '#4b5563', '#2563eb', '#16a34a', '#ea580c', '#b91c1c', '#7c3aed'];
  const presetSizes = [2, 4, 8, 12];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Brush</span>
          <div className="flex items-center gap-1">
            {presetSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                className={`inline-flex h-7 items-center justify-center rounded-full border text-[10px] transition-colors px-2 ${
                  brushSize === size ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Color</span>
          <div className="flex items-center gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBrushColor(color)}
                className={`h-6 w-6 rounded-full border-2 transition-colors ${
                  brushColor === color ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                aria-label="Select brush color"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          width={1024}
          height={512}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
    </div>
  );
};

