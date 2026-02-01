import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { FlagshipEventCard } from "./FlagshipEventCard";

export function FlagshipEventsCarousel() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["flagship-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, name, description, mode, start_date, end_date, 
          capacity, status, branding, landing_page_slug,
          organizations:organization_id (name, logo_url)
        `)
        .eq("visibility", "PUBLIC")
        .eq("status", "PUBLISHED")
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-16 border-t border-border/60">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[380px] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="py-16 border-t border-border/60"
    >
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Flagship Events</h2>
            </div>
            <p className="text-muted-foreground">Discover upcoming experiences from top organizations</p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link to="/events">
              View all events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {events.map((event) => (
              <CarouselItem key={event.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <FlagshipEventCard event={event as any} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>

        {/* Mobile View All Button */}
        <div className="mt-6 sm:hidden">
          <Button variant="outline" asChild className="w-full">
            <Link to="/events">
              View all events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
