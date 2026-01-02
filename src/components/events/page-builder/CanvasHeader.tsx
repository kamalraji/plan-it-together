import React from 'react';
import { Play, Plus, Monitor, Smartphone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CanvasHeaderProps {
  device: 'Desktop' | 'Mobile';
  onDeviceChange: (device: 'Desktop' | 'Mobile') => void;
  canvasWidth?: number;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  device,
  onDeviceChange,
  canvasWidth = 1200,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Play size={14} className="ml-0.5" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 h-8 px-3 rounded-lg bg-background border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              {device === 'Desktop' ? (
                <Monitor size={14} />
              ) : (
                <Smartphone size={14} />
              )}
              <span>{device}</span>
              <span className="text-muted-foreground">· {device === 'Desktop' ? canvasWidth : 375}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onDeviceChange('Desktop')}>
              <Monitor size={14} className="mr-2" />
              Desktop · 1200
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeviceChange('Mobile')}>
              <Smartphone size={14} className="mr-2" />
              Mobile · 375
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button variant="outline" size="sm" className="h-8 gap-1.5">
        Breakpoint
        <Plus size={14} />
      </Button>
    </div>
  );
};
