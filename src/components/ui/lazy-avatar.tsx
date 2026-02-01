import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from '@/lib/utils';

interface LazyAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Lazy loaded avatar with intersection observer
export const LazyAvatar = React.memo(function LazyAvatar({
  src,
  name,
  size = 'md',
  className,
  fallbackClassName,
}: LazyAvatarProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const initials = getInitials(name);
  const shouldShowImage = isIntersecting && src && !hasError;

  return (
    <Avatar ref={elementRef} className={cn(sizeClasses[size], className)}>
      {shouldShowImage && (
        <AvatarImage 
          src={src} 
          alt={name || 'Avatar'}
          onLoad={() => setHasLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'transition-opacity duration-300',
            hasLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      <AvatarFallback 
        className={cn(
          'transition-opacity duration-200',
          hasLoaded && !hasError ? 'opacity-0 absolute' : 'opacity-100',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

export default LazyAvatar;
