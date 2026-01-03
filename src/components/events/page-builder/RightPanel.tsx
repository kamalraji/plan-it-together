import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Eye, Settings, Palette, Box, Sparkles, MousePointer, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RightPanelProps {
  stylesContainerRef?: React.RefObject<HTMLDivElement>;
  traitsContainerRef?: React.RefObject<HTMLDivElement>;
  onApplyAnimation?: (animationType: string, config: AnimationConfig) => void;
}

export interface AnimationConfig {
  type: string;
  duration: number;
  delay: number;
  easing: string;
}

type TabType = 'Design' | 'Prototype';

const ENTRANCE_ANIMATIONS = [
  { id: 'fade-in', label: 'Fade In', icon: '✨' },
  { id: 'slide-up', label: 'Slide Up', icon: '⬆️' },
  { id: 'slide-down', label: 'Slide Down', icon: '⬇️' },
  { id: 'slide-left', label: 'Slide Left', icon: '⬅️' },
  { id: 'slide-right', label: 'Slide Right', icon: '➡️' },
  { id: 'scale-in', label: 'Scale In', icon: '🔍' },
  { id: 'rotate-in', label: 'Rotate In', icon: '🔄' },
  { id: 'bounce', label: 'Bounce', icon: '🏀' },
];

const HOVER_EFFECTS = [
  { id: 'scale', label: 'Scale Up', icon: '📐' },
  { id: 'glow', label: 'Glow', icon: '💡' },
  { id: 'lift', label: 'Lift (Shadow)', icon: '🎈' },
  { id: 'color-shift', label: 'Color Shift', icon: '🎨' },
  { id: 'underline', label: 'Underline', icon: '➖' },
  { id: 'shake', label: 'Shake', icon: '📳' },
];

const EASING_OPTIONS = [
  { id: 'ease-out', label: 'Ease Out' },
  { id: 'ease-in', label: 'Ease In' },
  { id: 'ease-in-out', label: 'Ease In Out' },
  { id: 'spring', label: 'Spring' },
  { id: 'bounce', label: 'Bounce' },
];

export const RightPanel: React.FC<RightPanelProps> = ({ 
  stylesContainerRef, 
  traitsContainerRef,
  onApplyAnimation 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Design');

  return (
    <div className="flex h-full w-72 flex-col border-l border-[hsl(220,13%,18%)] bg-[hsl(220,13%,10%)]">
      {/* Tabs */}
      <div className="flex h-10 items-center border-b border-[hsl(220,13%,18%)] px-3">
        {(['Design', 'Prototype'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium transition-all duration-200',
              activeTab === tab
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.span
                layoutId="right-panel-tab"
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_hsl(221,83%,53%/0.5)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'Design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <DesignPanel 
                stylesContainerRef={stylesContainerRef} 
                traitsContainerRef={traitsContainerRef}
              />
            </motion.div>
          )}
          {activeTab === 'Prototype' && (
            <motion.div
              key="prototype"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PrototypePanel onApplyAnimation={onApplyAnimation} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface DesignPanelProps {
  stylesContainerRef?: React.RefObject<HTMLDivElement>;
  traitsContainerRef?: React.RefObject<HTMLDivElement>;
}

const DesignPanel: React.FC<DesignPanelProps> = ({ stylesContainerRef, traitsContainerRef }) => {
  return (
    <div className="p-3 space-y-4">
      {/* Component Properties (Traits) */}
      <Section 
        title="Properties" 
        icon={Settings}
        description="Edit selected element"
      >
        <div 
          ref={traitsContainerRef} 
          className="panel-traits min-h-[40px]"
        />
      </Section>

      {/* Element Styles */}
      <Section 
        title="Styles" 
        icon={Palette}
        description="Customize appearance"
      >
        <div ref={stylesContainerRef} className="panel-styles" />
      </Section>

      {/* Color styles */}
      <Section title="Color Tokens" icon={Box}>
        <div className="space-y-2">
          <ColorStyleItem label="Background" color="hsl(220,13%,10%)" />
          <ColorStyleItem label="Surface" color="hsl(220,13%,15%)" />
          <ColorStyleItem label="Primary" color="hsl(221,83%,53%)" glow />
          <ColorStyleItem label="Muted" color="hsl(215,20%,65%)" />
        </div>
      </Section>
    </div>
  );
};

interface PrototypePanelProps {
  onApplyAnimation?: (animationType: string, config: AnimationConfig) => void;
}

const PrototypePanel: React.FC<PrototypePanelProps> = ({ onApplyAnimation }) => {
  const [selectedEntrance, setSelectedEntrance] = useState<string | null>(null);
  const [selectedHover, setSelectedHover] = useState<string | null>(null);
  const [duration, setDuration] = useState(0.3);
  const [delay, setDelay] = useState(0);
  const [easing, setEasing] = useState('ease-out');

  const handleApplyAnimation = (type: 'entrance' | 'hover') => {
    const animationType = type === 'entrance' ? selectedEntrance : selectedHover;
    if (animationType && onApplyAnimation) {
      onApplyAnimation(animationType, {
        type,
        duration,
        delay,
        easing,
      });
    }
  };

  return (
    <div className="p-3 space-y-4">
      {/* Entrance Animations */}
      <Section title="Entrance Animations" icon={Sparkles}>
        <div className="grid grid-cols-2 gap-2">
          {ENTRANCE_ANIMATIONS.map((anim) => (
            <motion.button
              key={anim.id}
              onClick={() => setSelectedEntrance(anim.id === selectedEntrance ? null : anim.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all',
                selectedEntrance === anim.id
                  ? 'border-primary bg-primary/10 text-foreground shadow-[0_0_10px_hsl(221,83%,53%/0.2)]'
                  : 'border-[hsl(220,13%,20%)] bg-[hsl(220,13%,8%)] text-muted-foreground hover:border-[hsl(220,13%,25%)] hover:text-foreground'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{anim.icon}</span>
              <span className="truncate">{anim.label}</span>
            </motion.button>
          ))}
        </div>
        {selectedEntrance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <button
              onClick={() => handleApplyAnimation('entrance')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Apply Animation
            </button>
          </motion.div>
        )}
      </Section>

      {/* Hover Effects */}
      <Section title="Hover Effects" icon={MousePointer}>
        <div className="grid grid-cols-2 gap-2">
          {HOVER_EFFECTS.map((effect) => (
            <motion.button
              key={effect.id}
              onClick={() => setSelectedHover(effect.id === selectedHover ? null : effect.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all',
                selectedHover === effect.id
                  ? 'border-primary bg-primary/10 text-foreground shadow-[0_0_10px_hsl(221,83%,53%/0.2)]'
                  : 'border-[hsl(220,13%,20%)] bg-[hsl(220,13%,8%)] text-muted-foreground hover:border-[hsl(220,13%,25%)] hover:text-foreground'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{effect.icon}</span>
              <span className="truncate">{effect.label}</span>
            </motion.button>
          ))}
        </div>
        {selectedHover && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <button
              onClick={() => handleApplyAnimation('hover')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Apply Effect
            </button>
          </motion.div>
        )}
      </Section>

      {/* Animation Settings */}
      <Section title="Animation Settings" icon={Settings}>
        <div className="space-y-3">
          {/* Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</label>
              <span className="text-xs text-foreground tabular-nums">{duration}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[hsl(220,13%,20%)] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_6px_hsl(221,83%,53%/0.5)]"
            />
          </div>

          {/* Delay */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Delay</label>
              <span className="text-xs text-foreground tabular-nums">{delay}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[hsl(220,13%,20%)] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_6px_hsl(221,83%,53%/0.5)]"
            />
          </div>

          {/* Easing */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Easing</label>
            <div className="flex flex-wrap gap-1">
              {EASING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEasing(opt.id)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] transition-colors',
                    easing === opt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[hsl(220,13%,15%)] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Interaction Flow */}
      <Section title="Interactions" icon={ArrowRight}>
        <div className="rounded-lg border border-dashed border-[hsl(220,13%,25%)] bg-[hsl(220,13%,8%)] p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(220,13%,15%)]">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Select an element to add click, scroll, or page load triggers.
          </p>
        </div>
      </Section>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon?: React.ElementType;
  description?: string;
  addButton?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, description, addButton, children }) => (
  <div className="rounded-lg border border-[hsl(220,13%,18%)] bg-[hsl(220,13%,8%)] overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(220,13%,18%)]">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <h4 className="text-xs font-medium text-foreground">{title}</h4>
      </div>
      {addButton && (
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    {description && (
      <p className="px-3 pt-2 text-[10px] text-muted-foreground/60">{description}</p>
    )}
    <div className="p-3">
      {children}
    </div>
  </div>
);

interface ColorStyleItemProps {
  label: string;
  color: string;
  glow?: boolean;
}

const ColorStyleItem: React.FC<ColorStyleItemProps> = ({ label, color, glow }) => (
  <div className="flex items-center gap-2 group">
    <div
      className={cn(
        "h-5 w-5 rounded border border-[hsl(220,13%,25%)] transition-all",
        glow && "shadow-[0_0_8px_hsl(221,83%,53%/0.4)]"
      )}
      style={{ backgroundColor: color }}
    />
    <span className="text-xs text-foreground flex-1">{label}</span>
    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
    </button>
  </div>
);
