import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Code, Palette, Briefcase, Lightbulb, Users, Trophy,
  Mic, BookOpen, Rocket, Globe, Heart, Zap
} from 'lucide-react';

// Event interest categories for AI recommendations
export const EVENT_INTERESTS = [
  { id: 'hackathons', label: 'Hackathons', icon: Code, color: 'coral' },
  { id: 'workshops', label: 'Workshops', icon: BookOpen, color: 'teal' },
  { id: 'conferences', label: 'Conferences', icon: Mic, color: 'sunny' },
  { id: 'networking', label: 'Networking', icon: Users, color: 'coral' },
  { id: 'competitions', label: 'Competitions', icon: Trophy, color: 'teal' },
  { id: 'tech-talks', label: 'Tech Talks', icon: Zap, color: 'sunny' },
  { id: 'design', label: 'Design Events', icon: Palette, color: 'coral' },
  { id: 'startup', label: 'Startup Events', icon: Rocket, color: 'teal' },
  { id: 'career', label: 'Career Fairs', icon: Briefcase, color: 'sunny' },
  { id: 'social-impact', label: 'Social Impact', icon: Heart, color: 'coral' },
  { id: 'innovation', label: 'Innovation Labs', icon: Lightbulb, color: 'teal' },
  { id: 'global', label: 'Global Events', icon: Globe, color: 'sunny' },
] as const;

// What participants are looking for
export const LOOKING_FOR_OPTIONS = [
  { id: 'learn-new-skills', label: 'Learn new skills' },
  { id: 'build-portfolio', label: 'Build my portfolio' },
  { id: 'meet-people', label: 'Meet like-minded people' },
  { id: 'find-team', label: 'Find a team' },
  { id: 'job-opportunities', label: 'Job opportunities' },
  { id: 'mentorship', label: 'Mentorship' },
  { id: 'win-prizes', label: 'Win prizes' },
  { id: 'have-fun', label: 'Have fun!' },
];

interface InterestSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
  type?: 'events' | 'lookingFor';
  maxSelections?: number;
}

export function InterestSelector({
  selectedInterests,
  onChange,
  type = 'events',
  maxSelections = 6,
}: InterestSelectorProps) {
  const options = type === 'events' ? EVENT_INTERESTS : LOOKING_FOR_OPTIONS;

  const handleToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      onChange(selectedInterests.filter(i => i !== id));
    } else if (selectedInterests.length < maxSelections) {
      onChange([...selectedInterests, id]);
    }
  };

  const colorClasses = {
    coral: 'bg-coral/10 text-coral border-coral/30 hover:border-coral',
    teal: 'bg-teal/10 text-teal border-teal/30 hover:border-teal',
    sunny: 'bg-sunny/10 text-sunny border-sunny/30 hover:border-sunny',
  };

  const selectedColorClasses = {
    coral: 'bg-coral text-white border-coral',
    teal: 'bg-teal text-white border-teal',
    sunny: 'bg-sunny text-foreground border-sunny',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Select up to {maxSelections} options
        </span>
        <span className={cn(
          'font-medium',
          selectedInterests.length >= maxSelections ? 'text-amber-500' : 'text-muted-foreground'
        )}>
          {selectedInterests.length} / {maxSelections}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isSelected = selectedInterests.includes(option.id);
          const color = 'color' in option ? option.color : 'coral';
          const Icon = 'icon' in option ? option.icon : null;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!isSelected && selectedInterests.length >= maxSelections}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? selectedColorClasses[color as keyof typeof selectedColorClasses]
                  : colorClasses[color as keyof typeof colorClasses]
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
