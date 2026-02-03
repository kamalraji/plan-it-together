import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceStatsProps {
  eventId: string;
  sessionId?: string;
}

interface StatsData {
  totalRegistrations: number;
  attendedCount: number;
  notAttendedCount: number;
  checkInRate: number;
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({
  eventId,
  sessionId,
}) => {
  const queryClient = useQueryClient();
  const [animateKey, setAnimateKey] = useState(0);

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['attendance-stats', eventId, sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('attendance-report', {
        body: { eventId, sessionId },
      });
      if (error || !data?.success) {
        throw error || new Error('Failed to load stats');
      }
      return {
        totalRegistrations: data.data.totalRegistrations,
        attendedCount: data.data.attendedCount,
        notAttendedCount: data.data.totalRegistrations - data.data.attendedCount,
        checkInRate: data.data.checkInRate,
      };
    },
    refetchInterval: 10000, // Refetch every 10 seconds as backup
  });

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`attendance_stats_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Trigger animation and refetch stats
          setAnimateKey((prev) => prev + 1);
          queryClient.invalidateQueries({ queryKey: ['attendance-stats', eventId, sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, sessionId, queryClient]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Registered',
      value: stats?.totalRegistrations ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Checked In',
      value: stats?.attendedCount ?? 0,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      highlight: true,
    },
    {
      label: 'Pending',
      value: stats?.notAttendedCount ?? 0,
      icon: UserX,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Check-in Rate',
      value: `${(stats?.checkInRate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-xl bg-card border border-border p-4 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{item.label}</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${item.label}-${animateKey}`}
                  initial={item.highlight ? { scale: 1.2, color: 'hsl(var(--primary))' } : {}}
                  animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                  transition={{ duration: 0.3 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground"
                >
                  {item.value}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
            </div>
          </div>
          
          {/* Progress bar for check-in rate */}
          {item.label === 'Check-in Rate' && stats && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.checkInRate}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          )}
          
          {/* Highlight pulse effect on update */}
          {item.highlight && (
            <AnimatePresence>
              <motion.div
                key={`pulse-${animateKey}`}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-green-500/20 rounded-xl pointer-events-none"
              />
            </AnimatePresence>
          )}
        </motion.div>
      ))}
    </div>
  );
};
