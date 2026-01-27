import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isToday, differenceInHours, differenceInMinutes } from 'date-fns';

interface TodayEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  organization_id: string;
}

interface UpcomingShift {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  workspace_id: string;
}

interface MobilePriorityCardProps {
  todayEvents: TodayEvent[];
  upcomingShifts: UpcomingShift[];
  tasksDueCount: number;
  orgSlug: string;
}

export const MobilePriorityCard: React.FC<MobilePriorityCardProps> = ({
  todayEvents,
  upcomingShifts,
  tasksDueCount,
  orgSlug,
}) => {
  const navigate = useNavigate();

  // Determine priority context
  const activeEvent = todayEvents.find(e => e.status === 'ONGOING');
  const upcomingEventToday = todayEvents.find(e => e.status === 'PUBLISHED' && isToday(new Date(e.start_date)));
  const nextShift = upcomingShifts[0];

  // Active Event - Show live status
  if (activeEvent) {
    const endTime = new Date(activeEvent.end_date);
    const hoursLeft = differenceInHours(endTime, new Date());
    const minutesLeft = differenceInMinutes(endTime, new Date()) % 60;

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-cyan-500 p-5 text-primary-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-card/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card/20 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Now
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-1 line-clamp-1">{activeEvent.name}</h3>
          <p className="text-primary-foreground/80 text-sm mb-4">
            {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m remaining` : `${minutesLeft}m remaining`}
          </p>
          
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-card/20 hover:bg-card/30 text-primary-foreground border-0"
            onClick={() => navigate(`/${orgSlug}/eventmanagement/${activeEvent.id}`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Event
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Upcoming Event Today - Show countdown
  if (upcomingEventToday) {
    const startTime = new Date(upcomingEventToday.start_date);
    const hoursUntil = differenceInHours(startTime, new Date());
    const minutesUntil = differenceInMinutes(startTime, new Date()) % 60;

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Starting Soon</span>
          </div>
          
          <h3 className="text-lg font-bold mb-1 line-clamp-1">{upcomingEventToday.name}</h3>
          <p className="text-white/80 text-sm mb-4">
            Starts in {hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${minutesUntil}m`}
          </p>
          
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-card/20 hover:bg-card/30 text-white border-0"
            onClick={() => navigate(`/${orgSlug}/eventmanagement/${upcomingEventToday.id}`)}
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Next Shift - Show volunteer context
  if (nextShift && isToday(new Date(nextShift.date))) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-5 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Your Shift Today</span>
          </div>
          
          <h3 className="text-lg font-bold mb-1 line-clamp-1">{nextShift.name}</h3>
          <p className="text-white/80 text-sm mb-1">
            {nextShift.start_time} - {nextShift.end_time}
          </p>
          {nextShift.location && (
            <p className="text-white/70 text-xs mb-4">{nextShift.location}</p>
          )}
          
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-card/20 hover:bg-card/30 text-white border-0"
            onClick={() => navigate(`/${orgSlug}/workspaces/${nextShift.workspace_id}`)}
          >
            View Shift Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Tasks Due - Show task focus
  if (tasksDueCount > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 p-5 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Tasks Due Today</span>
          </div>
          
          <h3 className="text-3xl font-bold mb-1">{tasksDueCount}</h3>
          <p className="text-white/80 text-sm mb-4">
            {tasksDueCount === 1 ? 'task needs your attention' : 'tasks need your attention'}
          </p>
          
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-card/20 hover:bg-card/30 text-white border-0"
            onClick={() => navigate(`/${orgSlug}/workspaces`)}
          >
            View Tasks
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // All Caught Up state
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 text-white">
      <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">All Caught Up!</span>
        </div>
        
        <h3 className="text-lg font-bold mb-1">You're all set</h3>
        <p className="text-white/80 text-sm mb-4">
          No urgent items right now. Explore your workspaces or create something new.
        </p>
        
        <Button 
          size="sm" 
          variant="secondary"
          className="bg-card/20 hover:bg-card/30 text-white border-0"
          onClick={() => navigate(`/${orgSlug}/workspaces`)}
        >
          Explore Workspaces
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
