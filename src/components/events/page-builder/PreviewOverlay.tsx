import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface DeviceConfig {
  width: number;
  height: number;
  label: string;
  icon: React.ElementType;
}

const DEVICES: Record<DeviceType, DeviceConfig> = {
  desktop: { width: 1280, height: 800, label: 'Desktop', icon: Monitor },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: Tablet },
  mobile: { width: 375, height: 812, label: 'Mobile', icon: Smartphone },
};

interface PreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  html: string;
  css: string;
  eventId?: string;
}

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  open,
  onClose,
  html,
  css,
  eventId,
}) => {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [zoom, setZoom] = useState(0.75);
  const [isLandscape, setIsLandscape] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentDevice = DEVICES[device];
  const frameWidth = isLandscape ? currentDevice.height : currentDevice.width;
  const frameHeight = isLandscape ? currentDevice.width : currentDevice.height;

  // Inject content into iframe
  useEffect(() => {
    if (!open || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();
  }, [open, html, css]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));

  const handleOpenExternal = () => {
    if (eventId) {
      window.open(`${window.location.origin}/events/${eventId}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-900"
        >
          {/* Toolbar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-700 bg-neutral-800 px-4">
            {/* Left: Close */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 text-neutral-300 hover:text-white hover:bg-neutral-700"
              >
                <X className="h-5 w-5" />
              </Button>
              <span className="text-sm font-medium text-white">Preview</span>
            </div>

            {/* Center: Device selector */}
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-1 rounded-lg bg-neutral-700/50 p-1">
                {(Object.keys(DEVICES) as DeviceType[]).map((d) => {
                  const config = DEVICES[d];
                  const Icon = config.icon;
                  return (
                    <Tooltip key={d}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDevice(d)}
                          className={cn(
                            'h-8 w-8',
                            device === d
                              ? 'bg-neutral-600 text-white'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-600/50'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {config.label} ({config.width}×{config.height})
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Rotate (for tablet/mobile) */}
                {device !== 'desktop' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsLandscape(!isLandscape)}
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-600/50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Rotate {isLandscape ? 'Portrait' : 'Landscape'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

            {/* Right: Zoom & External */}
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.25}
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Zoom Out</TooltipContent>
                  </Tooltip>

                  <span className="w-12 text-center text-xs text-neutral-300">
                    {Math.round(zoom * 100)}%
                  </span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={zoom >= 1.5}
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Zoom In</TooltipContent>
                  </Tooltip>
                </div>

                {eventId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleOpenExternal}
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Open in New Tab</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center overflow-auto bg-neutral-900 p-8">
            {/* Device Frame */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
              }}
            >
              {/* Device bezel (for mobile/tablet) */}
              {device !== 'desktop' && (
                <div
                  className={cn(
                    'absolute -inset-3 rounded-[2rem] bg-neutral-800 shadow-2xl',
                    'border border-neutral-700'
                  )}
                />
              )}

              {/* Iframe container */}
              <div
                className={cn(
                  'relative bg-white overflow-hidden',
                  device === 'desktop' ? 'rounded-lg shadow-2xl' : 'rounded-[1.5rem]'
                )}
                style={{
                  width: frameWidth,
                  height: frameHeight,
                }}
              >
                <iframe
                  ref={iframeRef}
                  title="Page Preview"
                  className="h-full w-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </motion.div>
          </div>

          {/* Bottom info bar */}
          <div className="flex h-8 shrink-0 items-center justify-center border-t border-neutral-700 bg-neutral-800 text-xs text-neutral-400">
            {frameWidth} × {frameHeight}px • Press Escape to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
