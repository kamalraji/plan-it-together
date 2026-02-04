import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserCheck, 
  Ticket, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CalendarCheck,
  Award,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventQuickStatsProps {
  eventId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    max: number;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBg,
  trend,
  progress 
}) => (
  <Card>
    <CardContent className="pt-4 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-500"
            )}>
              <TrendingUp className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
              <span>{trend.value}% {trend.label}</span>
            </div>
          )}
          {progress && (
            <div className="mt-2 space-y-1">
              <Progress value={(progress.value / progress.max) * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {progress.value} of {progress.max}
              </p>
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const EventQuickStats: React.FC<EventQuickStatsProps> = ({ eventId }) => {
  // Fetch comprehensive event stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['event-quick-stats', eventId],
    queryFn: async () => {
      // Parallel queries for different stats
      const [
        registrationsResult,
        attendanceResult,
        ticketTiersResult,
        certificatesResult,
        eventResult
      ] = await Promise.all([
        // Registration stats
        supabase
          .from('registrations')
          .select('status, total_amount')
          .eq('event_id', eventId),
        
        // Attendance stats
        supabase
          .from('attendance_records')
          .select('id')
          .eq('event_id', eventId),
        
        // Ticket tier stats
        supabase
          .from('ticket_tiers')
          .select('id, name, quantity, sold_count, price')
          .eq('event_id', eventId)
          .eq('is_active', true),
        
        // Certificate stats
        supabase
          .from('certificates')
          .select('id')
          .eq('event_id', eventId),
        
        // Event capacity
        supabase
          .from('events')
          .select('capacity')
          .eq('id', eventId)
          .single()
      ]);

      const registrations = registrationsResult.data || [];
      const attendance = attendanceResult.data || [];
      const ticketTiers = ticketTiersResult.data || [];
      const certificates = certificatesResult.data || [];
      const event = eventResult.data;

      // Calculate stats
      const confirmedRegs = registrations.filter((r: { status: string }) => r.status === 'CONFIRMED');
      const pendingRegs = registrations.filter((r: { status: string }) => r.status === 'PENDING');
      const cancelledRegs = registrations.filter((r: { status: string }) => r.status === 'CANCELLED');
      
      const totalRevenue = confirmedRegs.reduce((sum: number, r: { total_amount: number | null }) => sum + (r.total_amount || 0), 0);
      
      const totalTicketCapacity = ticketTiers.reduce((sum: number, t: { quantity: number | null }) => sum + (t.quantity || 0), 0);
      const totalTicketsSold = ticketTiers.reduce((sum: number, t: { sold_count: number | null }) => sum + (t.sold_count || 0), 0);
      
      const attendanceRate = confirmedRegs.length > 0 
        ? Math.round((attendance.length / confirmedRegs.length) * 100) 
        : 0;

      return {
        registrations: {
          total: registrations.length,
          confirmed: confirmedRegs.length,
          pending: pendingRegs.length,
          cancelled: cancelledRegs.length,
        },
        attendance: {
          checkedIn: attendance.length,
          rate: attendanceRate,
        },
        tickets: {
          totalCapacity: totalTicketCapacity || event?.capacity || 0,
          sold: totalTicketsSold,
          tiersCount: ticketTiers.length,
        },
        revenue: {
          total: totalRevenue,
        },
        certificates: {
          issued: certificates.length,
        },
        eventCapacity: event?.capacity || 0,
      };
    },
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const capacityUsed = stats.tickets.totalCapacity > 0 
    ? Math.round((stats.registrations.confirmed / stats.tickets.totalCapacity) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Event Metrics
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <StatCard
          title="Total Registrations"
          value={stats.registrations.confirmed}
          subtitle={stats.registrations.pending > 0 ? `${stats.registrations.pending} pending` : undefined}
          icon={<Users className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          progress={stats.tickets.totalCapacity > 0 ? {
            value: stats.registrations.confirmed,
            max: stats.tickets.totalCapacity
          } : undefined}
        />

        {/* Check-in Rate */}
        <StatCard
          title="Attendance"
          value={`${stats.attendance.rate}%`}
          subtitle={`${stats.attendance.checkedIn} checked in`}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-500/10"
        />

        {/* Tickets Sold */}
        <StatCard
          title="Tickets Sold"
          value={stats.tickets.sold}
          subtitle={`Across ${stats.tickets.tiersCount} tier${stats.tickets.tiersCount !== 1 ? 's' : ''}`}
          icon={<Ticket className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-500/10"
          progress={stats.tickets.totalCapacity > 0 ? {
            value: stats.tickets.sold,
            max: stats.tickets.totalCapacity
          } : undefined}
        />

        {/* Revenue */}
        <StatCard
          title="Total Revenue"
          value={`$${stats.revenue.total.toLocaleString()}`}
          subtitle="From confirmed registrations"
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold">{stats.registrations.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Capacity Used</p>
                <p className="text-lg font-semibold">{capacityUsed}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Certificates</p>
                <p className="text-lg font-semibold">{stats.certificates.issued}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-lg font-semibold">{stats.registrations.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
