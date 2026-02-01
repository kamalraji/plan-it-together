import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Camera, Utensils, MapPin, Music, Sparkles, Video, Mic2, Truck, Shield, Paintbrush, Box, Printer, Megaphone, MoreHorizontal, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryData {
  category: string;
  count: number;
}

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; bg: string }> = {
  'VENUE': { icon: MapPin, bg: 'bg-emerald-100 text-emerald-700' },
  'CATERING': { icon: Utensils, bg: 'bg-rose-100 text-rose-700' },
  'PHOTOGRAPHY': { icon: Camera, bg: 'bg-amber-100 text-amber-700' },
  'VIDEOGRAPHY': { icon: Video, bg: 'bg-red-100 text-red-700' },
  'ENTERTAINMENT': { icon: Music, bg: 'bg-violet-100 text-violet-700' },
  'DECORATION': { icon: Sparkles, bg: 'bg-pink-100 text-pink-700' },
  'AUDIO_VISUAL': { icon: Mic2, bg: 'bg-cyan-100 text-cyan-700' },
  'TRANSPORTATION': { icon: Truck, bg: 'bg-blue-100 text-blue-700' },
  'SECURITY': { icon: Shield, bg: 'bg-slate-100 text-slate-700' },
  'CLEANING': { icon: Paintbrush, bg: 'bg-teal-100 text-teal-700' },
  'EQUIPMENT_RENTAL': { icon: Box, bg: 'bg-orange-100 text-orange-700' },
  'PRINTING': { icon: Printer, bg: 'bg-indigo-100 text-indigo-700' },
  'MARKETING': { icon: Megaphone, bg: 'bg-purple-100 text-purple-700' },
  'OTHER': { icon: MoreHorizontal, bg: 'bg-gray-100 text-gray-700' },
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

interface CategoryStripProps {
  onCategorySelect?: (category: string | undefined) => void;
  selectedCategory?: string;
}

export const CategoryStrip: React.FC<CategoryStripProps> = ({ 
  onCategorySelect,
  selectedCategory 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data: services, error } = await supabase
        .from('vendor_services')
        .select('category')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const categoryCount: Record<string, number> = {};
      services?.forEach(service => {
        categoryCount[service.category] = (categoryCount[service.category] || 0) + 1;
      });

      return Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count) as CategoryData[];
    },
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-20 rounded-lg shrink-0" />
        ))}
      </div>
    );
  }

  const allCategories = categories || Object.keys(CATEGORY_CONFIG).map(cat => ({ category: cat, count: 0 }));

  return (
    <div className="relative group">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Category Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All Category */}
        <button
          onClick={() => onCategorySelect?.(undefined)}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 min-w-[72px] sm:min-w-[80px] p-3 rounded-lg transition-all',
            'hover:shadow-md hover:-translate-y-0.5',
            !selectedCategory 
              ? 'bg-primary/10 border-2 border-primary shadow-sm' 
              : 'bg-card border border-border hover:border-primary/30'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-foreground whitespace-nowrap">All</span>
        </button>

        {allCategories.map(({ category, count }) => {
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['OTHER'];
          const Icon = config.icon;
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onCategorySelect?.(isSelected ? undefined : category)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 min-w-[72px] sm:min-w-[80px] p-3 rounded-lg transition-all',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected 
                  ? 'bg-primary/10 border-2 border-primary shadow-sm' 
                  : 'bg-card border border-border hover:border-primary/30'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-foreground whitespace-nowrap">
                {formatCategory(category).split(' ')[0]}
              </span>
              {count > 0 && (
                <span className="text-[10px] text-muted-foreground">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryStrip;
