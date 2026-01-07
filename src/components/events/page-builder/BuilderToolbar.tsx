import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  MousePointer2, 
  Plus, 
  LayoutGrid, 
  Type, 
  Image, 
  Component,
  Play,
  Share2,
  MoreHorizontal,
  ChevronDown,
  Undo2,
  Redo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BuilderToolbarProps {
  projectName?: string;
  onSave: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  saving: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  projectName = 'Event Page',
  onSave,
  onPreview,
  onUndo,
  onRedo,
  saving,
  canUndo = true,
  canRedo = true,
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 items-center justify-between border-b border-[hsl(220,13%,18%)] bg-[hsl(220,13%,10%)] px-2">
        {/* Left: Logo + Tools */}
        <div className="flex items-center gap-1">
          {/* Logo dropdown */}
          <button className="flex h-8 items-center gap-1 rounded-md px-2 hover:bg-[hsl(220,13%,15%)] transition-colors">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/60 text-[10px] font-bold text-primary-foreground shadow-[0_0_12px_hsl(221,83%,53%/0.4)]">
              E
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          <div className="mx-2 h-5 w-px bg-[hsl(220,13%,20%)]" />

          {/* Tool buttons */}
          <ToolButton icon={MousePointer2} tooltip="Select (V)" active />
          <ToolButton icon={Plus} tooltip="Add element" />
          <ToolButton icon={LayoutGrid} tooltip="Layout" />
          <ToolButton icon={Type} tooltip="Text" />
          <ToolButton icon={Image} tooltip="Media" />
          <ToolButton icon={Component} tooltip="Components" />

          <div className="mx-2 h-5 w-px bg-[hsl(220,13%,20%)]" />

          {/* Undo/Redo */}
          <ToolButton icon={Undo2} tooltip="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
          <ToolButton icon={Redo2} tooltip="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />
        </div>

        {/* Center: Project name */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Drafts</span>
          <span className="text-muted-foreground">/</span>
          <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
            {projectName}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(220,13%,15%)]"
            onClick={onPreview}
          >
            <Play className="h-3.5 w-3.5" />
            Preview
          </Button>

          <Button
            size="sm"
            className="h-7 gap-1.5 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_hsl(221,83%,53%/0.3)]"
            onClick={onSave}
            disabled={saving}
          >
            <Share2 className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Publish'}
          </Button>

          <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-[hsl(220,13%,15%)] transition-colors">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};

interface ToolButtonProps {
  icon: React.ElementType;
  tooltip?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, tooltip, active, disabled, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150',
          disabled && 'opacity-40 cursor-not-allowed',
          active
            ? 'bg-[hsl(220,13%,18%)] text-foreground shadow-[inset_0_0_0_1px_hsl(220,13%,25%)]'
            : 'text-muted-foreground hover:bg-[hsl(220,13%,15%)] hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    </TooltipTrigger>
    {tooltip && (
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    )}
  </Tooltip>
);
