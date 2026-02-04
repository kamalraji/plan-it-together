import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Section {
  id: string;
  label: string;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'about', label: 'About' },
  { id: 'details', label: 'Details' },
  { id: 'register', label: 'Register' },
  { id: 'organizer', label: 'Organizer' },
];

interface EventScrollSpyProps {
  sections?: Section[];
  className?: string;
}

export function EventScrollSpy({ sections = DEFAULT_SECTIONS, className }: EventScrollSpyProps) {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero
      setIsVisible(window.scrollY > 200);

      // Find current section
      const scrollPosition = window.scrollY + 120; // Offset for nav height

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed nav
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Filter to only show sections that exist in the DOM
  const [availableSections, setAvailableSections] = useState<Section[]>([]);

  useEffect(() => {
    const existing = sections.filter((s) => document.getElementById(s.id));
    setAvailableSections(existing);
  }, [sections]);

  if (!isVisible || availableSections.length < 2) return null;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm',
        className
      )}
      role="navigation"
      aria-label="Page sections navigation"
    >
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center justify-center gap-1 py-3 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Navigate to page sections"
        >
          {availableSections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={section.id}
                aria-label={`Navigate to ${section.label} section`}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap min-h-[44px] min-w-[44px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {section.label}
                {isActive && (
                  <motion.div
                    layoutId="scroll-spy-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-full -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

export default EventScrollSpy;
