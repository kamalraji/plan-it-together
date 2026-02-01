import { 
  Accessibility, 
  Ear, 
  HandHelping, 
  Subtitles, 
  Dog, 
  Volume2 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AccessibilityFeature {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const accessibilityFeatures: AccessibilityFeature[] = [
  {
    id: 'wheelchair',
    icon: Accessibility,
    label: 'Wheelchair Accessible',
    description: 'Venue is fully wheelchair accessible with ramps and elevators.',
  },
  {
    id: 'hearing-loop',
    icon: Ear,
    label: 'Hearing Loop',
    description: 'Hearing loop system available for hearing aid users.',
  },
  {
    id: 'sign-language',
    icon: HandHelping,
    label: 'Sign Language',
    description: 'Sign language interpretation available upon request.',
  },
  {
    id: 'live-captions',
    icon: Subtitles,
    label: 'Live Captions',
    description: 'Real-time captions displayed during presentations.',
  },
  {
    id: 'service-animals',
    icon: Dog,
    label: 'Service Animals',
    description: 'Service animals are welcome at all event areas.',
  },
  {
    id: 'quiet-room',
    icon: Volume2,
    label: 'Quiet Room',
    description: 'Quiet room available for sensory breaks.',
  },
];

interface AccessibilityBadgesProps {
  /** Array of enabled feature IDs (e.g., ['wheelchair', 'hearing-loop']) */
  enabledFeatures: string[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show labels alongside icons */
  showLabels?: boolean;
  className?: string;
}

export function AccessibilityBadges({
  enabledFeatures,
  size = 'md',
  showLabels = false,
  className,
}: AccessibilityBadgesProps) {
  const filteredFeatures = accessibilityFeatures.filter((f) =>
    enabledFeatures.includes(f.id)
  );

  if (filteredFeatures.length === 0) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <TooltipProvider>
      <div
        className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}
        role="list"
        aria-label="Accessibility features"
      >
        {filteredFeatures.map((feature) => (
          <Tooltip key={feature.id}>
            <TooltipTrigger asChild>
              <div
                role="listitem"
                className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors ${
                  showLabels ? 'pr-3' : ''
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center rounded-full bg-primary/10 text-primary ${sizeClasses[size]}`}
                >
                  <feature.icon className={iconSizes[size]} />
                </div>
                {showLabels && (
                  <span className="text-xs font-medium">{feature.label}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default AccessibilityBadges;
