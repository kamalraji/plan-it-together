/**
 * Shared components for Event Form sections
 */
import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  isOpen: boolean;
  stepNumber: number;
  isConditional?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  isOpen,
  stepNumber,
  isConditional,
}) => (
  <div className="flex items-center gap-4 w-full py-4 px-2">
    <div
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300',
        isOpen
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
            isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          Step {stepNumber}
        </span>
        {isConditional && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
            Conditional
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground mt-0.5">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{description}</p>
    </div>
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300',
        isOpen ? 'bg-primary/10 rotate-0' : 'bg-transparent -rotate-90'
      )}
    >
      <ChevronDownIcon
        className={cn(
          'h-5 w-5 transition-transform duration-300',
          isOpen ? 'text-primary' : 'text-muted-foreground'
        )}
      />
    </div>
  </div>
);

interface FormSectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

export const FormSectionWrapper: React.FC<FormSectionWrapperProps> = ({
  children,
  className,
  borderColor = 'border-primary/20',
}) => (
  <div
    className={cn(
      'px-4 sm:px-6 pb-6 space-y-6 border-l-2 ml-7 mr-4',
      borderColor,
      className
    )}
  >
    {children}
  </div>
);

interface SectionInfoBoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent';
}

export const SectionInfoBox: React.FC<SectionInfoBoxProps> = ({
  children,
  variant = 'default',
}) => (
  <div
    className={cn(
      'rounded-xl border border-border/50 p-4',
      variant === 'accent' ? 'bg-accent/5' : 'bg-muted/30'
    )}
  >
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);
