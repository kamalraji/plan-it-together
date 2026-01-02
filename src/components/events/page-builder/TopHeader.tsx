import React from 'react';
import { ChevronDown, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorToolbar } from './EditorToolbar';
import { slugify } from './pageBuilderUtils';

interface TopHeaderProps {
  eventName?: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview: () => void;
  onSave: () => void;
  saving: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  eventName = 'Event Page',
  slug,
  onSlugChange,
  onUndo,
  onRedo,
  onPreview,
  onSave,
  saving,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
      {/* Left: Logo + Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <ChevronDown size={16} className="text-muted-foreground" />
        </div>

        <EditorToolbar
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Center: Page name + Slug */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Drafts /</span>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {eventName}
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Slug input */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1">
          <span className="text-xs text-muted-foreground">/e/</span>
          <Input
            value={slug}
            onChange={(e) => onSlugChange(slugify(e.target.value))}
            className="h-6 w-28 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
            placeholder="my-event"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="h-8 gap-1.5"
        >
          <ExternalLink size={14} />
          Preview
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="h-8 gap-1.5"
        >
          <Share2 size={14} />
          {saving ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </header>
  );
};
