import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { type ReactNode } from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
  isSelected: boolean;
  onSelect: () => void;
  accentColor?: 'coral' | 'teal';
}

export function RoleCard({
  title,
  description,
  icon,
  features,
  isSelected,
  onSelect,
  accentColor = 'coral',
}: RoleCardProps) {
  const gradientClasses = {
    coral: 'from-coral/20 to-coral/5',
    teal: 'from-teal/20 to-teal/5',
  };

  const borderClasses = {
    coral: 'border-coral/50 ring-coral/30',
    teal: 'border-teal/50 ring-teal/30',
  };

  const iconBgClasses = {
    coral: 'bg-coral/10 text-coral',
    teal: 'bg-teal/10 text-teal',
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-300 w-full',
        'bg-gradient-to-br backdrop-blur-sm',
        gradientClasses[accentColor],
        isSelected
          ? cn('ring-4', borderClasses[accentColor])
          : 'border-border/50 hover:border-primary/30'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center',
            accentColor === 'coral' ? 'bg-coral' : 'bg-teal'
          )}
        >
          <Check className="h-4 w-4 text-white" />
        </motion.div>
      )}

      {/* Icon */}
      <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center mb-4', iconBgClasses[accentColor])}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-4">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mt-auto">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0', accentColor === 'coral' ? 'bg-coral' : 'bg-teal')} />
            {feature}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}
