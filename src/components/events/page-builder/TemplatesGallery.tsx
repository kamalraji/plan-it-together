import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PAGE_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from './templates';

export type { TemplateData };

interface TemplatesGalleryProps {
  onSelectTemplate: (template: TemplateData) => void;
  selectedTemplateId?: string;
}

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'all'
    ? PAGE_TEMPLATES
    : PAGE_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors',
              activeCategory === cat.id
                ? 'bg-[var(--gjs-accent)] text-primary-foreground'
                : 'bg-[var(--gjs-bg-tertiary)] text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplateId === template.id;
          const isHovered = hoveredTemplate === template.id;

          return (
            <motion.button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={cn(
                'relative rounded-lg overflow-hidden text-left transition-all border',
                isSelected
                  ? 'border-[var(--gjs-accent)] ring-1 ring-[var(--gjs-accent)]'
                  : 'border-[var(--gjs-border)] hover:border-[var(--gjs-text-muted)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity',
                  isHovered ? 'opacity-100' : 'opacity-70'
                )} />
                
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-foreground/50 backdrop-blur-sm">
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary-foreground">{template.category}</span>
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="font-medium text-primary-foreground text-sm mb-0.5">{template.name}</h4>
                  <p className="text-[11px] text-primary-foreground/70 line-clamp-1">{template.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatesGallery;
