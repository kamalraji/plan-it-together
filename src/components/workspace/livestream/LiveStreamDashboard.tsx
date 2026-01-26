import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, Plus, Radio, Clock, Eye, TrendingUp, 
  Calendar, BarChart3, Settings, PlayCircle, Sparkles, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useLiveStreams, useLiveStreamSubscription } from '@/hooks/useLiveStreaming';
import { YouTubeChannelCard } from './YouTubeChannelCard';
import { CreateStreamModal } from './CreateStreamModal';
import { StreamControlPanel } from './StreamControlPanel';
import { LiveIndicator } from './LiveIndicator';
import { ViewerCounter } from './ViewerCounter';
import { LiveStream, StreamStatus } from '@/types/livestream.types';
import { cn } from '@/lib/utils';

interface LiveStreamDashboardProps {
  workspaceId: string;
  eventId: string;
}

export function LiveStreamDashboard({ workspaceId, eventId }: LiveStreamDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  
  const { data: streams = [], isLoading } = useLiveStreams(workspaceId);
  
  // Subscribe to real-time updates for selected stream
  useLiveStreamSubscription(selectedStreamId || undefined);

  const activeStreams = streams.filter(s => s.stream_status === 'live');
  const upcomingStreams = streams.filter(s => s.stream_status === 'scheduled' || s.stream_status === 'preparing');
  const pastStreams = streams.filter(s => s.stream_status === 'ended');

  const selectedStream = selectedStreamId 
    ? streams.find(s => s.id === selectedStreamId) 
    : activeStreams[0] || upcomingStreams[0];

  const totalViewers = activeStreams.reduce((sum, s) => sum + s.viewer_count, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted/50 animate-pulse rounded-2xl" />
          <div className="h-80 bg-muted/50 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Now Card - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className={cn(
            "relative overflow-hidden border-0 shadow-xl",
            activeStreams.length > 0 
              ? "bg-gradient-to-br from-red-500/10 via-red-500/5 to-card ring-2 ring-red-500/30 shadow-red-500/20" 
              : "bg-card"
          )}>
            {activeStreams.length > 0 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <CardContent className="pt-5 pb-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {activeStreams.length > 0 ? (
                    <LiveIndicator size="sm" variant="minimal" />
                  ) : (
                    <Radio className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Live Now</span>
                </div>
                {activeStreams.length > 0 && (
                  <LiveIndicator size="sm" variant="badge" showText={false} />
                )}
              </div>
              <div className="text-3xl font-bold">{activeStreams.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Viewers - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(
            "relative overflow-hidden border-0 shadow-xl",
            totalViewers > 0 
              ? "bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-card" 
              : "bg-card"
          )}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Eye className={cn("h-4 w-4", totalViewers > 0 && "text-orange-500")} />
                <span className="text-sm font-medium">Total Viewers</span>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={totalViewers}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl font-bold"
                >
                  {totalViewers.toLocaleString()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500/5 to-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Upcoming</span>
              </div>
              <div className="text-3xl font-bold">{upcomingStreams.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Streams - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Streams</span>
              </div>
              <div className="text-3xl font-bold">{streams.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Control / List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Stream Control */}
          {selectedStream && selectedStream.stream_status !== 'ended' ? (
            <StreamControlPanel stream={selectedStream} workspaceId={workspaceId} />
          ) : (
            <Card className="border-dashed border-2 shadow-lg bg-gradient-to-br from-card to-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div 
                  className="p-5 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-600/10 mb-6"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Video className="h-10 w-10 text-red-500" />
                </motion.div>
                <h3 className="font-bold text-xl mb-2">No Active Streams</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Create a new stream to start broadcasting to your audience on YouTube
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 h-12 px-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-xl shadow-red-500/25"
                  >
                    <Plus className="h-5 w-5" />
                    Create Stream
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          )}

          {/* Stream List with Premium Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="upcoming" className="gap-2 rounded-lg data-[state=active]:shadow-md">
                  <Clock className="h-4 w-4" />
                  Upcoming
                  {upcomingStreams.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-500/20 text-blue-600">
                      {upcomingStreams.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2 rounded-lg data-[state=active]:shadow-md">
                  <PlayCircle className="h-4 w-4" />
                  Past
                </TabsTrigger>
              </TabsList>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gap-2 rounded-xl border-dashed"
                >
                  <Plus className="h-4 w-4" />
                  New Stream
                </Button>
              </motion.div>
            </div>

            <TabsContent value="upcoming" className="space-y-3 mt-0">
              {upcomingStreams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No upcoming streams scheduled</p>
                </div>
              ) : (
                upcomingStreams.map((stream, index) => (
                  <StreamListItem 
                    key={stream.id} 
                    stream={stream} 
                    isSelected={selectedStreamId === stream.id}
                    onSelect={() => setSelectedStreamId(stream.id)}
                    index={index}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3 mt-0">
              {pastStreams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No past streams</p>
                </div>
              ) : (
                pastStreams.slice(0, 5).map((stream, index) => (
                  <StreamListItem 
                    key={stream.id} 
                    stream={stream}
                    isSelected={selectedStreamId === stream.id}
                    onSelect={() => setSelectedStreamId(stream.id)}
                    index={index}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <YouTubeChannelCard workspaceId={workspaceId} />

          {/* Premium Streaming Tips */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">Streaming Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div 
                className="flex gap-3 text-sm"
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-muted/50 h-fit">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Use OBS or Streamlabs</p>
                  <p className="text-xs text-muted-foreground">
                    Copy your stream key into your broadcasting software
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex gap-3 text-sm"
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-muted/50 h-fit">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Schedule Ahead</p>
                  <p className="text-xs text-muted-foreground">
                    Let your audience know when you'll be live
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex gap-3 text-sm"
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-muted/50 h-fit">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Engage Your Audience</p>
                  <p className="text-xs text-muted-foreground">
                    Enable chat and interact with your viewers
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateStreamModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        workspaceId={workspaceId}
        eventId={eventId}
      />
    </div>
  );
}

interface StreamListItemProps {
  stream: LiveStream;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function StreamListItem({ stream, isSelected, onSelect, index }: StreamListItemProps) {
  const getStatusBadge = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return <LiveIndicator size="sm" variant="badge" />;
      case 'scheduled':
        return (
          <Badge variant="outline" className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30">
            <Clock className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      case 'preparing':
        return (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            Preparing
          </Badge>
        );
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-2xl border-2 transition-all",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-lg shadow-primary/10" 
          : "border-border/50 hover:border-primary/30 hover:bg-muted/50 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-semibold truncate">{stream.title || 'Untitled Stream'}</h4>
            {getStatusBadge(stream.stream_status)}
          </div>
          {stream.scheduled_start && stream.stream_status === 'scheduled' && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(stream.scheduled_start), "MMM d 'at' h:mm a")}
            </p>
          )}
          {stream.stream_status === 'ended' && stream.ended_at && (
            <p className="text-sm text-muted-foreground">
              Ended {format(new Date(stream.ended_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
        {stream.thumbnail_url ? (
          <img 
            src={stream.thumbnail_url} 
            alt=""
            className="w-24 h-14 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="w-24 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Video className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>
      
      {stream.stream_status === 'live' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50"
        >
          <ViewerCounter count={stream.viewer_count} size="sm" variant="minimal" />
        </motion.div>
      )}
    </motion.button>
  );
}
