import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, Minus, Plus, Maximize, Monitor, Tablet, Smartphone } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';
import { motion, AnimatePresence } from 'framer-motion';

interface CanvasAreaProps {
  containerRef: React.RefObject<HTMLDivElement>;
  device: 'Desktop' | 'Tablet' | 'Mobile';
  onDeviceChange: (device: 'Desktop' | 'Tablet' | 'Mobile') => void;
}

const ZOOM_LEVELS = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: 'Fit', value: 'fit' as const },
];

const DEVICES = [
  { id: 'Desktop' as const, icon: Monitor, width: 1200, label: 'Desktop' },
  { id: 'Tablet' as const, icon: Tablet, width: 768, label: 'Tablet' },
  { id: 'Mobile' as const, icon: Smartphone, width: 375, label: 'Mobile' },
];

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  containerRef,
  device,
  onDeviceChange,
}) => {
  const [zoom, setZoom] = useState<number | 'fit'>(1);
  
  const currentDevice = DEVICES.find(d => d.id === device) || DEVICES[0];
  const deviceWidth = currentDevice.width;

  const getZoomLabel = () => {
    if (zoom === 'fit') return 'Fit';
    return `${Math.round(zoom * 100)}%`;
  };

  const getTransformStyle = () => {
    if (zoom === 'fit') return { transform: 'scale(1)', transformOrigin: 'top center' };
    return { transform: `scale(${zoom})`, transformOrigin: 'top center' };
  };

  const handleZoomOut = () => {
    if (zoom === 'fit') setZoom(1);
    else if (zoom > 0.5) setZoom(Math.max(0.5, zoom - 0.25));
  };

  const handleZoomIn = () => {
    if (zoom === 'fit') setZoom(1);
    else if (zoom < 1) setZoom(Math.min(1, zoom + 0.25));
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-[var(--gjs-bg-primary)]">
      {/* Device bar */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--gjs-border)] bg-[var(--gjs-bg-secondary)] px-4">
        <div className="flex items-center gap-3">
          <button className="flex h-6 w-6 items-center justify-center rounded bg-[var(--gjs-accent)]/20 text-[var(--gjs-accent)]" type="button">
            <Play className="h-3 w-3" fill="currentColor" />
          </button>
          
          {/* Device Toggle Pills */}
          <div className="flex items-center gap-1 rounded-lg bg-[var(--gjs-bg-primary)] p-1 border border-[var(--gjs-border)]">
            {DEVICES.map((d) => {
              const Icon = d.icon;
              const isActive = device === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onDeviceChange(d.id)}
                  className={cn(
                    'relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all duration-300',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="device-indicator"
                      className="absolute inset-0 rounded-md bg-[var(--gjs-accent)] shadow-[0_0_12px_hsl(221,83%,53%/0.4)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10 hidden sm:inline">{d.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.span
              key={deviceWidth}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-[var(--gjs-text-muted)] tabular-nums"
            >
              {deviceWidth}px
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--gjs-text-muted)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)] transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <SimpleDropdown>
            <SimpleDropdownTrigger className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[var(--gjs-text-muted)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)] transition-colors min-w-[52px] justify-center">
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
            onClick={handleZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--gjs-text-muted)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoom('fit')}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded transition-colors ml-1',
              zoom === 'fit'
                ? 'bg-[var(--gjs-accent)]/20 text-[var(--gjs-accent)]'
                : 'text-[var(--gjs-text-muted)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)]'
            )}
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <motion.div
          layout
          initial={false}
          animate={{ 
            width: zoom === 'fit' ? '100%' : `min(${deviceWidth * (typeof zoom === 'number' ? zoom : 1)}px, 100%)`,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'mx-auto h-full overflow-hidden rounded-lg bg-[var(--gjs-bg-tertiary)] shadow-2xl ring-1 ring-[var(--gjs-border)]',
            zoom === 'fit' ? 'max-w-full' : ''
          )}
        >
          <div
            ref={containerRef}
            className="gjs-editor-container h-full w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px]"
            style={getTransformStyle()}
          />
        </motion.div>
      </div>
    </div>
  );
};
