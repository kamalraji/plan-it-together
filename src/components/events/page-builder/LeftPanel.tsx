import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Home, 
  Image as ImageIcon,
  Layout,
  Navigation,
  LayoutTemplate,
  Type,
  Video,
  Square,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2
} from 'lucide-react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { TemplatesGallery, TemplateData } from './TemplatesGallery';

interface LeftPanelProps {
  blocksContainerRef?: React.RefObject<HTMLDivElement>;
  layersContainerRef?: React.RefObject<HTMLDivElement>;
  layers?: LayerData[];
  onLayersReorder?: (layers: LayerData[]) => void;
  onLayerSelect?: (layerId: string) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
  onLayerLockToggle?: (layerId: string) => void;
  onLayerDelete?: (layerId: string) => void;
  selectedLayerId?: string;
  onSelectTemplate?: (template: TemplateData) => void;
  selectedTemplateId?: string;
  children?: React.ReactNode;
}

export interface LayerData {
  id: string;
  icon: React.ElementType;
  label: string;
  level: number;
  expanded?: boolean;
  visible?: boolean;
  locked?: boolean;
  children?: LayerData[];
}

type TabType = 'Pages' | 'Layers' | 'Assets';

// Default placeholder layers
const DEFAULT_LAYERS: LayerData[] = [
  { id: 'desktop', icon: Layout, label: 'Desktop', level: 0, expanded: true, visible: true, locked: false },
  { id: 'nav', icon: Navigation, label: 'Navigation', level: 1, visible: true, locked: false },
  { id: 'header', icon: LayoutTemplate, label: 'Header', level: 1, expanded: true, visible: true, locked: false },
  { id: 'hero', icon: Square, label: 'Hero', level: 2, expanded: true, visible: true, locked: false },
  { id: 'title', icon: Type, label: 'Title', level: 3, visible: true, locked: false },
  { id: 'paragraph', icon: Type, label: 'Paragraph', level: 3, visible: true, locked: false },
  { id: 'slideshow', icon: ImageIcon, label: 'Slideshow', level: 3, visible: true, locked: false },
  { id: 'video', icon: Video, label: 'Video', level: 2, visible: true, locked: false },
  { id: 'cta', icon: Square, label: 'CTA', level: 2, visible: true, locked: false },
  { id: 'videos', icon: Video, label: 'Videos', level: 1, visible: true, locked: false },
  { id: 'footer', icon: LayoutTemplate, label: 'Footer', level: 1, visible: true, locked: false },
];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  blocksContainerRef,
  layersContainerRef,
  layers = DEFAULT_LAYERS,
  onLayersReorder,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  selectedLayerId,
  onSelectTemplate,
  selectedTemplateId,
  children,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Layers');

  return (
    <div className="flex h-full w-48 sm:w-52 md:w-56 lg:w-64 xl:w-72 flex-col border-r border-[var(--gjs-border)] bg-[var(--gjs-bg-secondary)]">
      {/* Tabs */}
      <div className="flex h-10 items-center border-b border-[var(--gjs-border)] px-3">
        {(['Pages', 'Layers', 'Assets'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === tab
                ? 'bg-[var(--gjs-accent)] text-white'
                : 'text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Keep panels mounted so GrapesJS can render into refs even if tab isn't active yet */}
        <div className={cn(activeTab === 'Pages' ? 'block' : 'hidden')}>
          <PagesPanel />
        </div>

        <div className={cn(activeTab === 'Layers' ? 'block' : 'hidden')}>
          <LayersPanel 
            layersContainerRef={layersContainerRef}
            layers={layers}
            onLayersReorder={onLayersReorder}
            onLayerSelect={onLayerSelect}
            onLayerVisibilityToggle={onLayerVisibilityToggle}
            onLayerLockToggle={onLayerLockToggle}
            onLayerDelete={onLayerDelete}
            selectedLayerId={selectedLayerId}
          />
          {/* Version History (rendered as children) */}
          {children}
        </div>

        <div className={cn(activeTab === 'Assets' ? 'block' : 'hidden')}>
          <AssetsPanel 
            blocksContainerRef={blocksContainerRef}
            onSelectTemplate={onSelectTemplate}
            selectedTemplateId={selectedTemplateId}
          />
        </div>
      </div>
    </div>
  );
};

const PagesPanel: React.FC = () => {
  return (
    <div className="p-2">
      {/* Page selector */}
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)] transition-colors">
        <Home className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        <span>Home</span>
        <ChevronDown className="ml-auto h-3 w-3 text-[var(--gjs-text-muted)]" />
      </button>
    </div>
  );
};

interface LayersPanelProps {
  layersContainerRef?: React.RefObject<HTMLDivElement>;
  layers: LayerData[];
  onLayersReorder?: (layers: LayerData[]) => void;
  onLayerSelect?: (layerId: string) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
  onLayerLockToggle?: (layerId: string) => void;
  onLayerDelete?: (layerId: string) => void;
  selectedLayerId?: string;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ 
  layersContainerRef,
  layers,
  onLayersReorder,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  selectedLayerId,
}) => {
  const [localLayers, setLocalLayers] = useState(layers);

  const handleReorder = (newOrder: LayerData[]) => {
    setLocalLayers(newOrder);
    onLayersReorder?.(newOrder);
  };

  return (
    <div className="p-2">
      {/* Page dropdown */}
      <button className="mb-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)] transition-colors">
        <Home className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        <span>Home</span>
        <ChevronDown className="ml-auto h-3 w-3 text-[var(--gjs-text-muted)]" />
      </button>

      {/* Draggable layer tree */}
      <Reorder.Group axis="y" values={localLayers} onReorder={handleReorder} className="space-y-0.5">
        {localLayers.map((layer) => (
          <DraggableLayerItem
            key={layer.id}
            layer={layer}
            selected={selectedLayerId === layer.id}
            onSelect={() => onLayerSelect?.(layer.id)}
            onVisibilityToggle={() => onLayerVisibilityToggle?.(layer.id)}
            onLockToggle={() => onLayerLockToggle?.(layer.id)}
            onDelete={() => onLayerDelete?.(layer.id)}
          />
        ))}
      </Reorder.Group>

      {/* GrapesJS layers container (hidden but available) */}
      <div ref={layersContainerRef} className="panel-layers mt-4" />
    </div>
  );
};

interface DraggableLayerItemProps {
  layer: LayerData;
  selected?: boolean;
  onSelect?: () => void;
  onVisibilityToggle?: () => void;
  onLockToggle?: () => void;
  onDelete?: () => void;
}

const DraggableLayerItem: React.FC<DraggableLayerItemProps> = ({
  layer,
  selected,
  onSelect,
  onVisibilityToggle,
  onLockToggle,
  onDelete,
}) => {
  const dragControls = useDragControls();
  const [isExpanded, setIsExpanded] = useState(layer.expanded ?? false);
  const [showActions, setShowActions] = useState(false);
  const Icon = layer.icon;
  const paddingLeft = 8 + layer.level * 16;

  return (
    <Reorder.Item
      value={layer}
      dragListener={false}
      dragControls={dragControls}
      className="group"
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 50 
      }}
    >
      <motion.div
        className={cn(
          'flex items-center gap-1 rounded-md py-1 text-xs transition-colors relative',
          selected
            ? 'bg-[var(--gjs-accent)] text-white'
            : 'text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)]',
          !layer.visible && 'opacity-50'
        )}
        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px' }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-3 w-3 text-[var(--gjs-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Expand toggle */}
        {layer.expanded !== undefined ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0"
          >
            <ChevronRight className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-3" />
        )}

        {/* Icon */}
        <Icon className={cn(
          'h-3.5 w-3.5 shrink-0',
          selected ? 'text-white' : 'text-[var(--gjs-accent)]'
        )} />

        {/* Label */}
        <span className="truncate flex-1">{layer.label}</span>

        {/* Quick actions */}
        <div className={cn(
          'flex items-center gap-0.5 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVisibilityToggle?.();
            }}
            className="p-0.5 rounded hover:bg-[var(--gjs-bg-tertiary)] transition-colors"
          >
            {layer.visible ? (
              <Eye className="h-3 w-3 text-[var(--gjs-text-muted)]" />
            ) : (
              <EyeOff className="h-3 w-3 text-[var(--gjs-text-muted)]" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle?.();
            }}
            className="p-0.5 rounded hover:bg-[var(--gjs-bg-tertiary)] transition-colors"
          >
            {layer.locked ? (
              <Lock className="h-3 w-3 text-[var(--gjs-text-muted)]" />
            ) : (
              <Unlock className="h-3 w-3 text-[var(--gjs-text-muted)]" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-3 w-3 text-destructive/70" />
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

interface AssetsPanelProps {
  blocksContainerRef?: React.RefObject<HTMLDivElement>;
  onSelectTemplate?: (template: TemplateData) => void;
  selectedTemplateId?: string;
}

const AssetsPanel: React.FC<AssetsPanelProps> = ({ 
  blocksContainerRef,
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const [activeSection, setActiveSection] = useState<'blocks' | 'templates'>('templates');

  return (
    <div className="p-2">
      {/* Toggle between Blocks and Templates */}
      <div className="flex gap-1 mb-3 p-1 bg-[var(--gjs-bg-primary)] rounded-lg border border-[var(--gjs-border)]">
        <button
          onClick={() => setActiveSection('templates')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeSection === 'templates'
              ? 'bg-[var(--gjs-accent)] text-white'
              : 'text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]'
          )}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveSection('blocks')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeSection === 'blocks'
              ? 'bg-[var(--gjs-accent)] text-white'
              : 'text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]'
          )}
        >
          Blocks
        </button>
      </div>

      <div className="space-y-3">
        <div className={cn(activeSection === 'templates' ? 'block' : 'hidden')}>
          {onSelectTemplate && (
            <TemplatesGallery
              onSelectTemplate={onSelectTemplate}
              selectedTemplateId={selectedTemplateId}
            />
          )}
        </div>

        <div className={cn(activeSection === 'blocks' ? 'block' : 'hidden')}>
          <p className="px-2 text-xs text-[var(--gjs-text-muted)]">Drag blocks to add sections</p>
        </div>

        {/* GrapesJS blocks container (keep mounted so it can render on editor load) */}
        <div
          ref={blocksContainerRef}
          className={cn('panel-blocks', activeSection === 'blocks' ? 'block' : 'hidden')}
        />
      </div>
    </div>
  );
};
