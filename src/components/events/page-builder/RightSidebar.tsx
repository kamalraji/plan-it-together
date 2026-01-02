import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, Eye } from 'lucide-react';

interface PropertySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

interface ColorSwatchProps {
  color: string;
  name: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, name }) => (
  <div className="flex items-center gap-2">
    <div
      className="h-5 w-5 rounded-md border border-border"
      style={{ backgroundColor: color }}
    />
    <span className="text-sm text-foreground">{name}</span>
  </div>
);

type TabValue = 'design' | 'prototype';

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('design');

  return (
    <aside className="w-72 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Tab buttons */}
      <div className="flex border-b border-border">
        {(['design', 'prototype'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors capitalize',
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
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'design' && (
          <>
            {/* Page section */}
            <PropertySection title="Page" defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border border-border bg-background flex items-center justify-center">
                      <div className="h-4 w-4 bg-muted rounded-sm" />
                    </div>
                    <span className="text-sm text-muted-foreground">181910</span>
                  </div>
                  <span className="text-sm text-foreground">100%</span>
                  <Eye size={16} className="text-muted-foreground" />
                </div>
              </div>
            </PropertySection>

            {/* Local variables */}
            <PropertySection title="Local variables">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Plus size={14} />
                Add variable
              </button>
            </PropertySection>

            {/* Local styles */}
            <PropertySection title="Local styles">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Plus size={14} />
                Add style
              </button>
            </PropertySection>

            {/* Color styles */}
            <PropertySection title="Color styles" defaultOpen>
              <div className="space-y-2">
                <ColorSwatch color="hsl(222, 47%, 11%)" name="BG" />
                <ColorSwatch color="hsl(0, 0%, 100%)" name="Well" />
                <ColorSwatch color="hsl(40, 100%, 50%)" name="Accent" />
              </div>
            </PropertySection>

            {/* Effect styles */}
            <PropertySection title="Effect styles">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md border border-border bg-background shadow-md" />
                  <span className="text-sm text-foreground">Shadow</span>
                </div>
              </div>
            </PropertySection>

            {/* GrapesJS style manager container */}
            <div className="panel-styles px-2" />

            {/* Export section */}
            <PropertySection title="Export">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Plus size={14} />
                Add export
              </button>
            </PropertySection>
          </>
        )}

        {activeTab === 'prototype' && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Configure interactions and animations
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
