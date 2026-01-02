import React from 'react';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  Plus,
  Layers,
  Type,
  Image,
  Component,
  Undo2,
  Redo2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, active, onClick }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface EditorToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-2 py-1.5">
      <ToolButton icon={<MousePointer2 size={18} />} label="Select (V)" active />
      <ToolButton icon={<Plus size={18} />} label="Add element (A)" />
      
      <div className="mx-1 h-5 w-px bg-border" />
      
      <ToolButton icon={<Layers size={18} />} label="Frame (F)" />
      <ToolButton icon={<Type size={18} />} label="Text (T)" />
      <ToolButton icon={<Image size={18} />} label="Media" />
      <ToolButton icon={<Component size={18} />} label="Components" />
      
      <div className="mx-1 h-5 w-px bg-border" />
      
      <ToolButton 
        icon={<Undo2 size={18} />} 
        label="Undo (⌘Z)" 
        onClick={onUndo}
      />
      <ToolButton 
        icon={<Redo2 size={18} />} 
        label="Redo (⌘⇧Z)" 
        onClick={onRedo}
      />
    </div>
  );
};
