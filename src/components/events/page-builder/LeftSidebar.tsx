import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, FileText, Home, Layers2, FolderOpen } from 'lucide-react';

interface LayerItemProps {
  name: string;
  icon?: React.ReactNode;
  depth?: number;
  expanded?: boolean;
  selected?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  name,
  icon,
  depth = 0,
  expanded,
  selected,
  hasChildren,
  onToggle,
  onClick,
}) => (
  <div
    className={cn(
      'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm',
      selected
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    )}
    style={{ paddingLeft: `${8 + depth * 16}px` }}
    onClick={onClick}
  >
    {hasChildren && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className="p-0.5 hover:bg-background/20 rounded"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    )}
    {!hasChildren && <span className="w-5" />}
    {icon}
    <span className="truncate flex-1">{name}</span>
  </div>
);

interface LeftSidebarProps {
  eventName?: string;
}

type TabValue = 'pages' | 'layers' | 'assets';

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ eventName = 'Event Page' }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('layers');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['desktop', 'hero']));
  const [selectedItem, setSelectedItem] = useState<string | null>('title');

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
      {/* Tab buttons */}
      <div className="flex border-b border-border bg-muted/30">
        {(['pages', 'layers', 'assets'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2.5 text-sm font-medium transition-colors capitalize',
              activeTab === tab
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'pages' && (
          <div className="space-y-1">
            <LayerItem
              name={eventName}
              icon={<Home size={14} />}
              selected={false}
            />
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-0.5">
            <LayerItem
              name="Desktop"
              icon={<Layers2 size={14} className="text-primary" />}
              hasChildren
              expanded={expandedItems.has('desktop')}
              onToggle={() => toggleExpand('desktop')}
              onClick={() => setSelectedItem('desktop')}
              selected={selectedItem === 'desktop'}
            />
            {expandedItems.has('desktop') && (
              <>
                <LayerItem
                  name="Navigation"
                  icon={<FileText size={14} className="text-accent" />}
                  depth={1}
                  onClick={() => setSelectedItem('navigation')}
                  selected={selectedItem === 'navigation'}
                />
                <LayerItem
                  name="Header"
                  icon={<Layers2 size={14} className="text-primary" />}
                  depth={1}
                  hasChildren
                  expanded={expandedItems.has('hero')}
                  onToggle={() => toggleExpand('hero')}
                  onClick={() => setSelectedItem('header')}
                  selected={selectedItem === 'header'}
                />
                {expandedItems.has('hero') && (
                  <>
                    <LayerItem
                      name="Hero"
                      icon={<Layers2 size={14} className="text-primary" />}
                      depth={2}
                      onClick={() => setSelectedItem('hero')}
                      selected={selectedItem === 'hero'}
                    />
                    <LayerItem
                      name="Title"
                      icon={<FileText size={14} className="text-primary" />}
                      depth={3}
                      onClick={() => setSelectedItem('title')}
                      selected={selectedItem === 'title'}
                    />
                    <LayerItem
                      name="Paragraph"
                      icon={<FileText size={14} />}
                      depth={3}
                      onClick={() => setSelectedItem('paragraph')}
                      selected={selectedItem === 'paragraph'}
                    />
                  </>
                )}
                <LayerItem
                  name="Schedule"
                  icon={<Layers2 size={14} className="text-primary" />}
                  depth={1}
                  onClick={() => setSelectedItem('schedule')}
                  selected={selectedItem === 'schedule'}
                />
                <LayerItem
                  name="Registration"
                  icon={<Layers2 size={14} className="text-primary" />}
                  depth={1}
                  onClick={() => setSelectedItem('registration')}
                  selected={selectedItem === 'registration'}
                />
                <LayerItem
                  name="Footer"
                  icon={<Layers2 size={14} className="text-primary" />}
                  depth={1}
                  onClick={() => setSelectedItem('footer')}
                  selected={selectedItem === 'footer'}
                />
              </>
            )}
            {/* GrapesJS layer manager placeholder */}
            <div className="panel-layers mt-4" />
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <FolderOpen size={24} className="mb-2 opacity-50" />
            <p className="text-xs">Drag & drop assets here</p>
          </div>
        )}
      </div>

      {/* GrapesJS Blocks Panel */}
      <div className="border-t border-border flex-shrink-0">
        <div className="p-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Components
          </h4>
        </div>
        <div className="panel-blocks overflow-y-auto max-h-48 px-2 pb-2" />
      </div>
    </aside>
  );
};
