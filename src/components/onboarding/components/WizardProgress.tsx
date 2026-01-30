import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function WizardProgress({ currentStep, totalSteps, stepLabels }: WizardProgressProps) {
  const defaultLabels = ['Role', 'Profile', 'About', 'Connect', 'Preferences'];
  const labels = stepLabels || defaultLabels.slice(0, totalSteps);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Progress bar */}
      <div className="relative mb-8">
        {/* Background track */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Active progress */}
        <motion.div
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {labels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary shadow-lg ring-4 ring-primary/20',
                    isUpcoming && 'border-muted bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </motion.div>
                
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {label}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
