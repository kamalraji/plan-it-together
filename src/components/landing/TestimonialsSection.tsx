import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  company: string;
  avatarUrl?: string;
}

// Fallback testimonials for demo
const fallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      "Thittam1Hub transformed how we run our annual tech fest. From 500 registrations to QR check-ins to certificates—everything just works.",
    authorName: 'Priya Sharma',
    authorRole: 'Event Coordinator',
    company: 'Tech University',
    avatarUrl: undefined,
  },
  {
    id: '2',
    quote:
      "The certificate verification feature is a game-changer. Sponsors can instantly verify participation, which has increased our credibility significantly.",
    authorName: 'Rajesh Kumar',
    authorRole: 'Community Manager',
    company: 'StartupHub India',
    avatarUrl: undefined,
  },
  {
    id: '3',
    quote:
      "We used to spend days on spreadsheets after each event. Now our team has real-time dashboards and the reporting is automatic.",
    authorName: 'Anita Patel',
    authorRole: 'Operations Lead',
    company: 'Campus Connect',
    avatarUrl: undefined,
  },
  {
    id: '4',
    quote:
      "The workspace collaboration feature lets our volunteers self-organize without us micromanaging. Best decision we made this year.",
    authorName: 'Michael Chen',
    authorRole: 'Program Director',
    company: 'Innovation Labs',
    avatarUrl: undefined,
  },
];

interface TestimonialsSectionProps {
  className?: string;
  /** Auto-rotate interval in ms (0 to disable) */
  autoRotateInterval?: number;
}

export function TestimonialsSection({
  className,
  autoRotateInterval = 5000,
}: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch real testimonials from organizations with high event counts
  const { data: testimonials = fallbackTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      // Try to get organizations with verified status and high event counts
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .eq('verification_status', 'VERIFIED')
        .limit(4);

      if (error || !data || data.length < 2) {
        return fallbackTestimonials;
      }

      // In a real implementation, you'd have a testimonials table
      // For now, return fallback data
      return fallbackTestimonials;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotateInterval || isPaused) return;

    const interval = setInterval(goToNext, autoRotateInterval);
    return () => clearInterval(interval);
  }, [autoRotateInterval, isPaused, goToNext]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    },
    [goToNext, goToPrev]
  );

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      className={`py-16 md:py-20 bg-card/80 backdrop-blur-sm border-t border-border/60 ${className ?? ''}`}
      aria-labelledby="testimonials-heading"
    >
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            id="testimonials-heading"
            className="text-2xl md:text-3xl font-semibold tracking-tight mb-4"
          >
            Trusted by Event Organizers
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            See what teams are saying about running their events on Thittam1Hub.
          </p>
        </motion.div>

        {/* Testimonial carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Testimonials carousel"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-border/60 bg-background/80 p-8 md:p-12 text-center"
            >
              {/* Quote icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-6">
                <Quote className="w-5 h-5" />
              </div>

              {/* Quote text */}
              <blockquote className="text-lg md:text-xl font-medium text-foreground mb-8 max-w-2xl mx-auto">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex flex-col items-center gap-2">
                {currentTestimonial.avatarUrl ? (
                  <img
                    src={currentTestimonial.avatarUrl}
                    alt={currentTestimonial.authorName}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {currentTestimonial.authorName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {currentTestimonial.authorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTestimonial.authorRole} at {currentTestimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <button
            onClick={goToPrev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-12 h-12 rounded-full bg-background border border-border/60 shadow-md flex items-center justify-center hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-12 h-12 rounded-full bg-background border border-border/60 shadow-md flex items-center justify-center hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                index === currentIndex
                  ? 'bg-primary'
                  : 'bg-border hover:bg-muted-foreground/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
