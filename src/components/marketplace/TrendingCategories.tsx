import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Utensils, 
  Music, 
  MapPin, 
  Sparkles, 
  Users,
  PartyPopper,
  Flower2,
  Video,
  Mic2,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryData {
  category: string;
  count: number;
  trending: boolean;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'PHOTOGRAPHY': Camera,
  'CATERING': Utensils,
  'MUSIC': Music,
  'VENUE': MapPin,
  'DECORATION': Sparkles,
  'PLANNING': Users,
  'ENTERTAINMENT': PartyPopper,
  'FLORISTRY': Flower2,
  'VIDEOGRAPHY': Video,
  'AUDIO': Mic2,
};

const CATEGORY_COLORS: Record<string, string> = {
  'PHOTOGRAPHY': 'from-amber-500/20 to-orange-500/20 border-amber-500/30 hover:border-amber-500/50',
  'CATERING': 'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-500/50',
  'MUSIC': 'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500/50',
  'VENUE': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50',
  'DECORATION': 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 hover:border-fuchsia-500/50',
  'PLANNING': 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:border-blue-500/50',
  'ENTERTAINMENT': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 hover:border-yellow-500/50',
  'FLORISTRY': 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50',
  'VIDEOGRAPHY': 'from-red-500/20 to-rose-500/20 border-red-500/30 hover:border-red-500/50',
  'AUDIO': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-500/50',
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const TrendingCategories: React.FC = () => {
  const navigate = useNavigate();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['trending-categories'],
    queryFn: async () => {
      // Fetch service counts by category
      const { data: services, error } = await supabase
        .from('vendor_services')
        .select('category')
        .eq('status', 'ACTIVE');

      if (error) throw error;

      // Count services per category
      const categoryCount: Record<string, number> = {};
      services?.forEach(service => {
        const cat = service.category;
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      // Transform to array and sort
      const categoryData: CategoryData[] = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          trending: count >= 3, // Mark as trending if 3+ services
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return categoryData;
    },
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Browse by Category</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map(({ category, count, trending }) => {
          const Icon = CATEGORY_ICONS[category] || Sparkles;
          const colorClass = CATEGORY_COLORS[category] || 'from-gray-500/20 to-slate-500/20 border-gray-500/30 hover:border-gray-500/50';

          return (
            <button
              key={category}
              onClick={() => navigate(`/marketplace/services/${category.toLowerCase()}`)}
              className={`
                relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                bg-gradient-to-br ${colorClass}
                border transition-all duration-200
                hover:scale-105 hover:shadow-lg
                group cursor-pointer
              `}
            >
              {trending && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground"
                >
                  Hot
                </Badge>
              )}
              <Icon className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-foreground/90 text-center leading-tight">
                {formatCategory(category)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {count} service{count !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingCategories;
