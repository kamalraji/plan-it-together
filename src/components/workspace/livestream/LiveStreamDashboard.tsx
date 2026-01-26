import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, Plus, Radio, Clock, Eye, TrendingUp, 
  Calendar, BarChart3, Settings, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useLiveStreams, useLiveStreamSubscription } from '@/hooks/useLiveStreaming';
import { YouTubeChannelCard } from './YouTubeChannelCard';
import { CreateStreamModal } from './CreateStreamModal';
import { StreamControlPanel } from './StreamControlPanel';
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

  const getStatusBadge = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-500 text-white gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            LIVE
          </Badge>
        );
      case 'scheduled':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>;
      case 'preparing':
        return <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Preparing</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted/50 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-muted/50 animate-pulse rounded-xl" />
          <div className="h-64 bg-muted/50 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className={cn(
            "relative overflow-hidden",
            activeStreams.length > 0 && "ring-2 ring-red-500/50"
          )}>
            {activeStreams.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
            )}
            <CardContent className="pt-4 relative">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Radio className={cn("h-4 w-4", activeStreams.length > 0 && "text-red-500 animate-pulse")} />
                <span className="text-sm">Live Now</span>
              </div>
              <div className="text-2xl font-bold">{activeStreams.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Total Viewers</span>
              </div>
              <div className="text-2xl font-bold">{totalViewers.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Upcoming</span>
              </div>
              <div className="text-2xl font-bold">{upcomingStreams.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Total Streams</span>
              </div>
              <div className="text-2xl font-bold">{streams.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Control / List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Stream Control */}
          {selectedStream && selectedStream.stream_status !== 'ended' ? (
            <StreamControlPanel stream={selectedStream} workspaceId={workspaceId} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-red-500/10 mb-4">
                  <Video className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Active Streams</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-sm">
                  Create a new stream to start broadcasting to your audience
                </p>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Stream
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stream List */}
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="upcoming" className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  Upcoming
                  {upcomingStreams.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {upcomingStreams.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-1.5">
                  <PlayCircle className="h-4 w-4" />
                  Past
                </TabsTrigger>
              </TabsList>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New Stream
              </Button>
            </div>

            <TabsContent value="upcoming" className="space-y-3">
              {upcomingStreams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming streams scheduled
                </p>
              ) : (
                upcomingStreams.map((stream) => (
                  <StreamListItem 
                    key={stream.id} 
                    stream={stream} 
                    isSelected={selectedStreamId === stream.id}
                    onSelect={() => setSelectedStreamId(stream.id)}
                    getStatusBadge={getStatusBadge}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {pastStreams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No past streams
                </p>
              ) : (
                pastStreams.slice(0, 5).map((stream) => (
                  <StreamListItem 
                    key={stream.id} 
                    stream={stream}
                    isSelected={selectedStreamId === stream.id}
                    onSelect={() => setSelectedStreamId(stream.id)}
                    getStatusBadge={getStatusBadge}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <YouTubeChannelCard 
            workspaceId={workspaceId}
            channel={null} // Will be connected via OAuth
          />

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Streaming Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-primary/10 h-fit">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Use OBS or Streamlabs</p>
                  <p className="text-xs text-muted-foreground">
                    Copy your stream key into your broadcasting software
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-primary/10 h-fit">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Schedule Ahead</p>
                  <p className="text-xs text-muted-foreground">
                    Let your audience know when you'll be live
                  </p>
                </div>
              </div>
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
  getStatusBadge: (status: StreamStatus) => React.ReactNode;
}

function StreamListItem({ stream, isSelected, onSelect, getStatusBadge }: StreamListItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary" 
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{stream.title || 'Untitled Stream'}</h4>
            {getStatusBadge(stream.stream_status)}
          </div>
          {stream.scheduled_start && stream.stream_status === 'scheduled' && (
            <p className="text-sm text-muted-foreground">
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
            className="w-20 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Video className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      {stream.stream_status === 'live' && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm">
            <Eye className="h-4 w-4 text-red-500" />
            <span className="font-medium">{stream.viewer_count}</span>
            <span className="text-muted-foreground">watching</span>
          </div>
        </div>
      )}
    </motion.button>
  );
}
