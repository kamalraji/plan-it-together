import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Predefined skill categories for AI matching
export const SKILL_CATEGORIES = {
  technical: [
    'JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Java', 'C++',
    'Machine Learning', 'Data Science', 'DevOps', 'Cloud Computing', 'Mobile Development',
    'UI/UX Design', 'Blockchain', 'IoT', 'Cybersecurity', 'Game Development'
  ],
  creative: [
    'Graphic Design', 'Video Editing', 'Content Writing', 'Photography',
    'Animation', 'Illustration', 'Music Production', '3D Modeling'
  ],
  business: [
    'Marketing', 'Sales', 'Project Management', 'Business Development',
    'Finance', 'Strategy', 'Operations', 'HR', 'Public Speaking'
  ],
  soft: [
    'Leadership', 'Team Collaboration', 'Communication', 'Problem Solving',
    'Critical Thinking', 'Creativity', 'Time Management', 'Adaptability'
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

interface SkillSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  placeholder?: string;
}

export function SkillSelector({
  selectedSkills,
  onChange,
  maxSkills = 10,
  placeholder = 'Search or add skills...',
}: SkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SKILLS.filter(s => !selectedSkills.includes(s));
    const query = searchQuery.toLowerCase();
    return ALL_SKILLS.filter(
      s => s.toLowerCase().includes(query) && !selectedSkills.includes(s)
    );
  }, [searchQuery, selectedSkills]);

  const canAddCustom = searchQuery.trim().length >= 2 && 
    !ALL_SKILLS.some(s => s.toLowerCase() === searchQuery.toLowerCase()) &&
    !selectedSkills.some(s => s.toLowerCase() === searchQuery.toLowerCase());

  const handleAddSkill = (skill: string) => {
    if (selectedSkills.length >= maxSkills) return;
    onChange([...selectedSkills, skill]);
    setSearchQuery('');
  };

  const handleRemoveSkill = (skill: string) => {
    onChange(selectedSkills.filter(s => s !== skill));
  };

  const handleAddCustom = () => {
    if (!canAddCustom || selectedSkills.length >= maxSkills) return;
    const customSkill = searchQuery.trim();
    onChange([...selectedSkills, customSkill]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Selected skills */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        <AnimatePresence mode="popLayout">
          {selectedSkills.map(skill => (
            <motion.div
              key={skill}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              layout
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {selectedSkills.length === 0 && (
          <span className="text-muted-foreground text-sm py-1.5">No skills selected yet</span>
        )}
      </div>

      {/* Counter */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {selectedSkills.length} / {maxSkills} skills
        </span>
        {selectedSkills.length >= maxSkills && (
          <span className="text-amber-500 font-medium">Maximum reached</span>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="pl-9"
          disabled={selectedSkills.length >= maxSkills}
        />
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isFocused && (searchQuery || filteredSkills.length > 0) && selectedSkills.length < maxSkills && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border bg-card p-3 shadow-lg max-h-48 overflow-y-auto"
          >
            {canAddCustom && (
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium text-primary hover:bg-primary/10 transition-colors mb-2"
              >
                <Plus className="h-4 w-4" />
                Add "{searchQuery.trim()}"
              </button>
            )}
            
            <div className="flex flex-wrap gap-2">
              {filteredSkills.slice(0, 15).map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    'bg-muted hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>

            {filteredSkills.length === 0 && !canAddCustom && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No matching skills found
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
