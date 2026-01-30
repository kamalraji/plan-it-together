import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, MapPin, Users, Clock, ArrowRight, Zap, XCircle, CheckCircle, Calendar } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { usePrefetchEvent } from "@/hooks/usePrefetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface EventBranding {
  bannerUrl?: string;
  primaryColor?: string;
}

interface Organization {
  name: string;
  logo_url: string | null;
}

interface FlagshipEvent {
  id: string;
  name: string;
  description: string | null;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  start_date: string;
  end_date: string;
  capacity: number | null;
  status: string;
  branding: EventBranding | null;
  landing_page_slug: string | null;
  organizations: Organization | null;
}

type EventStatus = "register_now" | "coming_soon" | "registration_closed" | "live" | "completed" | "cancelled";

function getEventStatus(event: FlagshipEvent): EventStatus {
  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  if (event.status === "CANCELLED") return "cancelled";
  if (now >= startDate && now <= endDate) return "live";
  if (now > endDate) return "completed";
  
  const daysUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntilStart > 7) return "coming_soon";
  
  return "register_now";
}

const modeConfig = {
  ONLINE: { icon: Globe, label: "Virtual", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  OFFLINE: { icon: MapPin, label: "In-Person", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  HYBRID: { icon: Users, label: "Hybrid", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

const statusConfig: Record<EventStatus, { icon: typeof Clock; label: string; className: string }> = {
  register_now: { icon: ArrowRight, label: "Register Now", className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  coming_soon: { icon: Clock, label: "Coming Soon", className: "bg-blue-600 hover:bg-blue-700 text-white" },
  registration_closed: { icon: XCircle, label: "Registration Closed", className: "bg-muted text-muted-foreground cursor-not-allowed" },
  live: { icon: Zap, label: "Live Now", className: "bg-red-600 hover:bg-red-700 text-white animate-pulse" },
  completed: { icon: CheckCircle, label: "Completed", className: "bg-muted text-muted-foreground cursor-not-allowed" },
  cancelled: { icon: XCircle, label: "Cancelled", className: "bg-destructive/20 text-destructive cursor-not-allowed" },
};

export const FlagshipEventCard = forwardRef<HTMLDivElement, { event: FlagshipEvent }>(
  function FlagshipEventCard({ event }, ref) {
    const status = getEventStatus(event);
    const startDate = new Date(event.start_date);
    const { timeLeft, isExpired } = useCountdown(status === "register_now" || status === "coming_soon" ? startDate : null);
    
    const ModeIcon = modeConfig[event.mode].icon;
    const StatusIcon = statusConfig[status].icon;
    const bannerUrl = event.branding?.bannerUrl;
    const eventLink = event.landing_page_slug ? `/e/${event.landing_page_slug}` : `/events/${event.id}`;
    const isClickable = status === "register_now" || status === "coming_soon" || status === "live";
    
    // Prefetch event data on hover for faster navigation
    const { prefetchBySlug } = usePrefetchEvent();
    
    const handleMouseEnter = () => {
      if (event.landing_page_slug) {
        prefetchBySlug(event.landing_page_slug);
      }
    };

    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="group relative h-full rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300"
        onMouseEnter={handleMouseEnter}
      >
      {/* Banner Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt={event.name} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ModeIcon className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="outline" className="bg-emerald-500/90 text-white border-0 text-xs font-medium">
            Free
          </Badge>
          <Badge variant="outline" className={`${modeConfig[event.mode].className} text-xs font-medium`}>
            <ModeIcon className="w-3 h-3 mr-1" />
            {modeConfig[event.mode].label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Organization */}
        {event.organizations && (
          <div className="flex items-center gap-2">
            {event.organizations.logo_url ? (
              <img 
                src={event.organizations.logo_url} 
                alt={event.organizations.name}
                loading="lazy"
                decoding="async"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {event.organizations.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">{event.organizations.name}</span>
          </div>
        )}

        {/* Event Title */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(startDate, "MMM d, yyyy 'at' h:mm a")}</span>
        </div>

        {/* Countdown Timer */}
        {!isExpired && (status === "register_now" || status === "coming_soon") && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Starts in:</span>
            <div className="flex gap-1 font-mono font-medium text-foreground">
              {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
              <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
              <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
              <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
            </div>
          </div>
        )}

        {/* Status Button */}
        <Button
          asChild={isClickable}
          className={`w-full ${statusConfig[status].className}`}
          disabled={!isClickable}
        >
          {isClickable ? (
            <Link to={eventLink}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusConfig[status].label}
            </Link>
          ) : (
            <>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusConfig[status].label}
            </>
          )}
        </Button>
      </div>
    </motion.div>
    );
  }
);
