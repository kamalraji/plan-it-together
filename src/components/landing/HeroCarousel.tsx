import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Calendar,
  QrCode,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  icon: React.ReactNode;
  gradient: string;
}

const slides: HeroSlide[] = [
  {
    id: "unified",
    badge: "Unified Platform",
    title: "One rail from event idea",
    highlight: "to verified outcomes",
    description:
      "Thittam1Hub turns every event into a trackable workspace—unifying registrations, QR-based attendance, judging, and certificate-backed proof.",
    cta: { label: "Get started free", href: "/register" },
    secondaryCta: { label: "Book a demo", href: "/help?intent=demo" },
    icon: <Calendar className="h-12 w-12" />,
    gradient: "from-primary/20 via-background to-accent/10",
  },
  {
    id: "certificates",
    badge: "QR Verification",
    title: "Certificates that",
    highlight: "anyone can verify",
    description:
      "Issue QR-backed certificates that sponsors, recruiters, and institutions can verify publicly—outcomes that are provable, not just claimed.",
    cta: { label: "Start issuing", href: "/register" },
    secondaryCta: { label: "See how it works", href: "#workflow" },
    icon: <Award className="h-12 w-12" />,
    gradient: "from-accent/20 via-background to-primary/10",
  },
  {
    id: "attendance",
    badge: "Real-time Tracking",
    title: "QR check-in that",
    highlight: "just works",
    description:
      "Replace paper registers and manual headcounts with instant QR scanning. Get live attendance dashboards for every session.",
    cta: { label: "Try it now", href: "/register" },
    secondaryCta: { label: "Learn more", href: "#features" },
    icon: <QrCode className="h-12 w-12" />,
    gradient: "from-primary/15 via-background to-secondary/10",
  },
  {
    id: "collaboration",
    badge: "Team Workspaces",
    title: "Collaboration made",
    highlight: "simple for teams",
    description:
      "Support colleges, companies, and communities with unified workspaces, role-based access, and analytics that make reporting effortless.",
    cta: { label: "Create workspace", href: "/register" },
    secondaryCta: { label: "Explore features", href: "#features" },
    icon: <Users className="h-12 w-12" />,
    gradient: "from-secondary/20 via-background to-accent/10",
  },
];

export function HeroCarousel() {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelect = useCallback(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, handleSelect]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!api || isPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, isPaused]);

  const handleNavigation = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.getElementById(href.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(href);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!api) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        api.scrollNext();
      }
    },
    [api]
  );

  return (
    <section
      className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Hero carousel"
      aria-roledescription="carousel"
    >
      {/* Background gradient based on active slide */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slides[activeIndex].gradient} transition-all duration-700`}
      />

      <div className="container relative">
        {/* Live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Slide {activeIndex + 1} of {slides.length}: {slides[activeIndex].badge}
        </div>
        
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={slide.id}>
                <AnimatePresence mode="wait">
                  {activeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center min-h-[400px] md:min-h-[440px]"
                    >
                      {/* Text Content */}
                      <div className="space-y-6">
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-[11px] font-medium text-accent-foreground shadow-sm"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          {slide.badge}
                        </motion.p>

                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight"
                        >
                          {slide.title}
                          <br />
                          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {slide.highlight}
                          </span>
                        </motion.h1>

                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="max-w-xl text-sm md:text-base text-muted-foreground"
                        >
                          {slide.description}
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="flex flex-wrap items-center gap-3"
                        >
                          <Button
                            className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:from-primary hover:to-primary/80 group"
                            onClick={() => handleNavigation(slide.cta.href)}
                          >
                            {slide.cta.label}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                          {slide.secondaryCta && (
                            <Button
                              variant="outline"
                              className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
                              onClick={() =>
                                handleNavigation(slide.secondaryCta!.href)
                              }
                            >
                              {slide.secondaryCta.label}
                            </Button>
                          )}
                        </motion.div>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-[11px] text-muted-foreground"
                        >
                          No credit card required · Built for campuses, communities, and organizations
                        </motion.p>
                      </div>

                      {/* Visual Panel */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative h-[280px] md:h-[340px] lg:h-[380px] rounded-3xl border border-border/60 bg-card/80 shadow-2xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/40 to-accent/20" />
                        <div className="relative h-full flex flex-col items-center justify-center p-8">
                          <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary">
                            {slide.icon}
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-lg font-semibold">{slide.badge}</p>
                            <p className="text-sm text-muted-foreground max-w-xs">
                              {slide.description.slice(0, 80)}...
                            </p>
                          </div>

                          {/* Decorative elements */}
                          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-background/80 border border-border/60 px-2 py-1 text-[10px] text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 h-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: "0%" }}
                              animate={{ width: isPaused ? `${((activeIndex + 1) / slides.length) * 100}%` : "100%" }}
                              transition={{ duration: isPaused ? 0 : 5, ease: "linear" }}
                              key={activeIndex}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselDots className="mt-8" />
        </Carousel>
      </div>
    </section>
  );
}
