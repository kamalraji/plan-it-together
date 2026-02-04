import React from 'react';

// Generic loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} ${className}`} />
  );
};

// Page loading component with spinner
export const PageLoading: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
};

// Skeleton loading components for different content types
export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
      <div className="mt-4 space-y-1">
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-card shadow rounded-lg overflow-hidden animate-pulse">
      {/* Table header */}
      <div className="bg-muted/40 px-6 py-3 border-b border-border">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded flex-1" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{
  items?: number;
}> = ({ items = 6 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border border-border p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="w-20 h-8 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-64 mb-2" />
      <div className="h-4 bg-muted rounded w-96" />
      </div>

      {/* Dashboard cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

// Progress bar component for loading states
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showPercentage?: boolean;
}> = ({ progress, className = '', showPercentage = false }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-muted-foreground">Loading...</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-muted/40 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Button loading state - Re-export ActionButton for backwards compatibility
export { ActionButton as LoadingButton } from '@/components/ui/action-button';

// Legacy LoadingButton for existing usage (will be deprecated)
export const LegacyLoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({ loading, children, className = '', disabled = false, onClick, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{children}</span>
    </button>
  );
};

// Inline loading component for small sections
export const InlineLoading: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Enhanced skeleton components for specific content types
export const SkeletonForm: React.FC<{
  fields?: number;
}> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-10 bg-muted rounded w-full" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <div className="h-10 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded w-20" />
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="bg-card p-6 rounded-lg border border-border animate-pulse">
      <div className="h-6 bg-muted rounded w-48 mb-4" />
      <div className="space-y-3">
        <div className="flex items-end space-x-2 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted rounded-t flex-1"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded w-8" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonProfile: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}> = ({ isLoading, children, message = 'Loading...', blur = true }) => {
  return (
    <div className="relative">
      <div className={isLoading && blur ? 'filter blur-sm pointer-events-none' : ''}>
        {children}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-card bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Shimmer effect component
export const ShimmerEffect: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
};

// Pulse loading component
export const PulseLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}> = ({ size = 'md', color = 'bg-indigo-600' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${color} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

// Typing indicator component
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <PulseLoader size="sm" color="bg-muted-foreground/20" />
      <span className="text-sm">Loading...</span>
    </div>
  );
};

// Content placeholder with action
export const ContentPlaceholder: React.FC<{
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};