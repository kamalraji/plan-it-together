import { motion } from 'framer-motion';
import { Clock, Radio, CheckCircle, AlertTriangle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamStatus } from '@/types/livestream.types';
import { LiveIndicator } from './LiveIndicator';

interface StreamStatusBannerProps {
  status: StreamStatus;
  title?: string;
  scheduledStart?: string;
  startedAt?: string;
  className?: string;
}

const statusConfig: Record<StreamStatus, {
  gradient: string;
  borderColor: string;
  icon: React.ElementType;
  iconColor: string;
  label: string;
  description: string;
}> = {
  live: {
    gradient: 'from-red-500/20 via-red-500/10 to-transparent',
    borderColor: 'border-red-500/40',
    icon: Radio,
    iconColor: 'text-red-500',
    label: 'Broadcasting',
    description: 'Your stream is live and viewers can watch',
  },
  scheduled: {
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    borderColor: 'border-blue-500/40',
    icon: Clock,
    iconColor: 'text-blue-500',
    label: 'Scheduled',
    description: 'Stream is scheduled for a future time',
  },
  preparing: {
    gradient: 'from-yellow-500/20 via-yellow-500/10 to-transparent',
    borderColor: 'border-yellow-500/40',
    icon: Pause,
    iconColor: 'text-yellow-500',
    label: 'Preparing',
    description: 'Getting ready to go live',
  },
  ended: {
    gradient: 'from-muted/50 via-muted/30 to-transparent',
    borderColor: 'border-border',
    icon: CheckCircle,
    iconColor: 'text-muted-foreground',
    label: 'Ended',
    description: 'Stream has concluded',
  },
  error: {
    gradient: 'from-destructive/20 via-destructive/10 to-transparent',
    borderColor: 'border-destructive/40',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    label: 'Error',
    description: 'There was a problem with the stream',
  },
};

export function StreamStatusBanner({
  status,
  title,
  scheduledStart,
  className,
}: StreamStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        `bg-gradient-to-r ${config.gradient}`,
        config.borderColor,
        className
      )}
    >
      {/* Animated pulse for live status */}
      {status === 'live' && (
        <motion.div
          className="absolute inset-0 bg-red-500/5"
          animate={{ opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-2.5 rounded-xl",
            status === 'live' ? 'bg-red-500/20' : 'bg-muted'
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              {title && (
                <h3 className="font-semibold text-lg">{title}</h3>
              )}
              {status === 'live' ? (
                <LiveIndicator size="sm" variant="badge" />
              ) : (
                <span className={cn(
                  "text-sm font-medium px-2 py-0.5 rounded-md",
                  status === 'scheduled' && 'bg-blue-500/20 text-blue-500',
                  status === 'preparing' && 'bg-yellow-500/20 text-yellow-500',
                  status === 'ended' && 'bg-muted text-muted-foreground',
                  status === 'error' && 'bg-destructive/20 text-destructive'
                )}>
                  {config.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {status === 'scheduled' && scheduledStart
                ? `Scheduled for ${new Date(scheduledStart).toLocaleString()}`
                : config.description
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
