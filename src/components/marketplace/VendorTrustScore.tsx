import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Star, 
  MessageCircle,
  Award,
  Zap
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TrustMetrics {
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  responseTime?: 'fast' | 'moderate' | 'slow';
  completedBookings?: number;
}

interface VendorTrustScoreProps {
  metrics: TrustMetrics;
  variant?: 'compact' | 'full' | 'badge';
  className?: string;
}

const calculateTrustScore = (metrics: TrustMetrics): number => {
  let score = 0;
  
  // Verification (30 points)
  if (metrics.isVerified) score += 30;
  
  // Rating (30 points max)
  score += (metrics.avgRating / 5) * 30;
  
  // Reviews (20 points max)
  const reviewScore = Math.min(metrics.reviewCount / 10, 1) * 20;
  score += reviewScore;
  
  // Response time (10 points)
  if (metrics.responseTime === 'fast') score += 10;
  else if (metrics.responseTime === 'moderate') score += 5;
  
  // Completed bookings (10 points max)
  if (metrics.completedBookings) {
    score += Math.min(metrics.completedBookings / 20, 1) * 10;
  }
  
  return Math.round(score);
};

const getTrustLevel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 90) return { label: 'Exceptional', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
  if (score >= 75) return { label: 'Excellent', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  if (score >= 60) return { label: 'Good', color: 'text-amber-600', bgColor: 'bg-amber-500' };
  if (score >= 40) return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-500' };
  return { label: 'New', color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/20' };
};

export const VendorTrustScore: React.FC<VendorTrustScoreProps> = ({
  metrics,
  variant = 'compact',
  className,
}) => {
  const score = calculateTrustScore(metrics);
  const trustLevel = getTrustLevel(score);

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
              'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20',
              className
            )}>
              <Award className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{score}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium mb-1">Trust Score: {score}/100</p>
            <p className="text-xs text-muted-foreground">
              Based on verification, ratings, reviews, and responsiveness
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Trust Score Circle */}
        <div className="relative">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30'
          )}>
            <span className="text-sm font-bold text-primary">{score}</span>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center gap-2">
          {metrics.isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </TooltipTrigger>
                <TooltipContent>Verified Vendor</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {metrics.avgRating >= 4 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </TooltipTrigger>
                <TooltipContent>Top Rated ({metrics.avgRating.toFixed(1)})</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {metrics.responseTime === 'fast' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Zap className="w-4 h-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>Fast Response</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {metrics.reviewCount >= 5 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <MessageCircle className="w-4 h-4 text-violet-500" />
                </TooltipTrigger>
                <TooltipContent>{metrics.reviewCount} Reviews</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('p-4 rounded-xl bg-card border', className)}>
      <div className="flex items-center gap-4 mb-4">
        {/* Large Score Circle */}
        <div className="relative">
          <svg className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(score / 100) * 176} 176`}
              className={trustLevel.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{score}</span>
          </div>
        </div>

        <div>
          <p className={cn('text-sm font-semibold', trustLevel.color)}>
            {trustLevel.label} Trust
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on 4 trust factors
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className={cn('w-4 h-4', metrics.isVerified ? 'text-emerald-500' : 'text-muted-foreground/50')} />
          <span className={metrics.isVerified ? 'text-foreground' : 'text-muted-foreground'}>
            {metrics.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-foreground">
            {metrics.avgRating > 0 ? `${metrics.avgRating.toFixed(1)} Rating` : 'No ratings'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MessageCircle className="w-4 h-4 text-violet-500" />
          <span className="text-foreground">
            {metrics.reviewCount} Review{metrics.reviewCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className={cn(
            'w-4 h-4',
            metrics.responseTime === 'fast' ? 'text-blue-500' : 
            metrics.responseTime === 'moderate' ? 'text-amber-500' : 'text-muted-foreground'
          )} />
          <span className="text-foreground capitalize">
            {metrics.responseTime || 'Unknown'} response
          </span>
        </div>
      </div>
    </div>
  );
};

export default VendorTrustScore;
