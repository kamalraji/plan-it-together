import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, Minus, Plus, Maximize } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';

interface CanvasAreaProps {
  containerRef: React.RefObject<HTMLDivElement>;
  device: 'Desktop' | 'Mobile';
  onDeviceChange: (device: 'Desktop' | 'Mobile') => void;
}

const ZOOM_LEVELS = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: 'Fit', value: 'fit' as const },
];

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  containerRef,
  device,
  onDeviceChange,
}) => {
  const [zoom, setZoom] = useState<number | 'fit'>(1);
  const deviceWidth = device === 'Desktop' ? '1200' : '375';

  const getZoomLabel = () => {
    if (zoom === 'fit') return 'Fit';
    return `${Math.round(zoom * 100)}%`;
  };

  const getTransformStyle = () => {
    if (zoom === 'fit') return { transform: 'scale(1)', transformOrigin: 'top center' };
    return { transform: `scale(${zoom})`, transformOrigin: 'top center' };
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-[hsl(220,13%,6%)]">
      {/* Device bar */}
      <div className="flex h-10 items-center justify-between border-b border-[hsl(220,13%,18%)] bg-[hsl(220,13%,10%)] px-4">
        <div className="flex items-center gap-3">
          <button className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary" type="button">
            <Play className="h-3 w-3" fill="currentColor" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeviceChange('Desktop')}
              className={cn(
                'text-sm transition-colors',
                device === 'Desktop' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Desktop
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => onDeviceChange('Mobile')}
              className={cn(
                'text-sm transition-colors',
                device === 'Mobile' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mobile
            </button>
            <span className="text-muted-foreground mx-1">·</span>
            <span className="text-sm text-muted-foreground">{deviceWidth}px</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (zoom === 'fit') setZoom(1);
              else if (zoom > 0.5) setZoom(Math.max(0.5, zoom - 0.25));
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-[hsl(220,13%,15%)] hover:text-foreground transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <SimpleDropdown>
            <SimpleDropdownTrigger className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-[hsl(220,13%,15%)] hover:text-foreground transition-colors min-w-[52px] justify-center">
              {getZoomLabel()}
            </SimpleDropdownTrigger>
            <SimpleDropdownContent align="center" className="min-w-[80px]">
              {ZOOM_LEVELS.map((level) => (
                <SimpleDropdownItem
                  key={level.label}
                  onClick={() => setZoom(level.value)}
                  className={cn('justify-center', zoom === level.value && 'bg-accent')}
                >
                  {level.label}
                </SimpleDropdownItem>
              ))}
            </SimpleDropdownContent>
          </SimpleDropdown>

          <button
            type="button"
            onClick={() => {
              if (zoom === 'fit') setZoom(1);
              else if (zoom < 1) setZoom(Math.min(1, zoom + 0.25));
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-[hsl(220,13%,15%)] hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoom('fit')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded transition-colors ml-1',
              zoom === 'fit'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-[hsl(220,13%,15%)] hover:text-foreground'
            )}
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative flex-1 overflow-auto p-6">
        <div
          className={cn(
            'mx-auto h-full overflow-hidden rounded-lg bg-[hsl(220,13%,12%)] shadow-2xl ring-1 ring-[hsl(220,13%,18%)]',
            zoom === 'fit' ? 'max-w-full' : ''
          )}
          style={zoom !== 'fit' ? { width: `${parseInt(deviceWidth) * (typeof zoom === 'number' ? zoom : 1)}px` } : {}}
        >
          <div
            ref={containerRef}
            className="gjs-editor-container h-full w-full"
            style={getTransformStyle()}
          />
        </div>
      </div>
    </div>
  );
};
