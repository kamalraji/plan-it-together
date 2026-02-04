import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Square, Clock, Signal, MessageSquare, 
  Copy, ExternalLink, Settings, Wifi, Radio,
  Zap, Activity, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';
import { LiveStream, StreamStatus } from '@/types/livestream.types';
import { useStartStream, useEndStream, useStreamAnalytics } from '@/hooks/useLiveStreaming';
import { cn } from '@/lib/utils';
import { LiveIndicator } from './LiveIndicator';
import { ViewerCounter } from './ViewerCounter';

interface StreamControlPanelProps {
  stream: LiveStream;
  workspaceId: string;
  onSettingsClick?: () => void;
}

export function StreamControlPanel({ stream, workspaceId, onSettingsClick }: StreamControlPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const [previousViewerCount, setPreviousViewerCount] = useState(stream.viewer_count);
  const startStream = useStartStream();
  const endStream = useEndStream();
  
  // Fetch analytics for live streams
  const { data: analytics } = useStreamAnalytics(
    stream.stream_status === 'live' ? stream.id : undefined,
    workspaceId
  );

  // Timer for live duration
  useEffect(() => {
    if (stream.stream_status !== 'live' || !stream.started_at) return;

    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), new Date(stream.started_at!)));
    }, 1000);

    return () => clearInterval(interval);
  }, [stream.stream_status, stream.started_at]);

  // Track viewer count changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPreviousViewerCount(stream.viewer_count);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [stream.viewer_count]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyStreamKey = () => {
    if (stream.youtube_stream_key) {
      navigator.clipboard.writeText(stream.youtube_stream_key);
      toast.success('Stream key copied to clipboard');
    }
  };

  const handleGoLive = () => {
    startStream.mutate({ workspaceId, streamId: stream.id });
  };

  const handleEndStream = () => {
    if (confirm('Are you sure you want to end this stream?')) {
      endStream.mutate({ workspaceId, streamId: stream.id });
    }
  };

  const getStatusGradient = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return 'from-red-500 via-red-600 to-red-700';
      case 'preparing':
        return 'from-yellow-500 via-yellow-600 to-orange-600';
      case 'scheduled':
        return 'from-blue-500 via-blue-600 to-indigo-600';
      case 'ended':
        return 'from-muted via-muted to-muted';
      case 'error':
        return 'from-destructive via-destructive to-destructive';
      default:
        return 'from-muted via-muted to-muted';
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-card/95">
      {/* Premium Gradient Status Bar */}
      <motion.div 
        className={cn("h-2 bg-gradient-to-r transition-all duration-500", getStatusGradient(stream.stream_status))}
        animate={stream.stream_status === 'live' ? { 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ backgroundSize: '200% 100%' }}
      />
      
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className={cn(
                "p-3 rounded-2xl",
                stream.stream_status === 'live' 
                  ? 'bg-gradient-to-br from-red-500/20 to-red-600/10' 
                  : 'bg-muted'
              )}
              animate={stream.stream_status === 'live' ? { 
                boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0)', '0 0 0 8px rgba(239, 68, 68, 0.1)', '0 0 0 0 rgba(239, 68, 68, 0)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Radio className={cn(
                "h-5 w-5",
                stream.stream_status === 'live' ? 'text-red-500' : 'text-muted-foreground'
              )} />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{stream.title || 'Untitled Stream'}</CardTitle>
                {stream.stream_status === 'live' && (
                  <LiveIndicator size="sm" variant="badge" />
                )}
              </div>
              {stream.stream_status !== 'live' && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "mt-1 font-semibold capitalize",
                    stream.stream_status === 'scheduled' && 'bg-blue-500/10 text-blue-500 border-blue-500/30',
                    stream.stream_status === 'preparing' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
                    stream.stream_status === 'ended' && 'bg-muted text-muted-foreground',
                    stream.stream_status === 'error' && 'bg-destructive/10 text-destructive border-destructive/30'
                  )}
                >
                  {stream.stream_status}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onSettingsClick} className="rounded-xl">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Premium Live Stats Dashboard */}
        <AnimatePresence mode="wait">
          {stream.stream_status === 'live' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              {/* Viewer Count - Premium Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/20"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <ViewerCounter 
                  count={stream.viewer_count} 
                  previousCount={previousViewerCount}
                  size="lg"
                  variant="minimal"
                  showTrend
                />
                <p className="text-xs text-muted-foreground mt-2">Watching Now</p>
              </motion.div>

              {/* Duration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-4 rounded-2xl bg-muted/50 border border-border"
              >
                <div className="flex items-center justify-center gap-2 text-foreground mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <motion.span 
                    className="text-2xl font-bold font-mono"
                    key={elapsed}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatDuration(elapsed)}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground">Duration</p>
              </motion.div>

              {/* Connection Quality */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20"
              >
                <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-2xl font-bold">Stable</span>
                </div>
                <p className="text-xs text-muted-foreground">Connection</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Peak Viewers & Average Watch Time (when live) */}
        {stream.stream_status === 'live' && analytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-semibold">{analytics.peakViewers}</p>
                <p className="text-xs text-muted-foreground">Peak viewers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-semibold">{Math.round(analytics.averageWatchTime / 60)}m</p>
                <p className="text-xs text-muted-foreground">Avg watch time</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stream Key Section */}
        {stream.youtube_stream_key && stream.stream_status !== 'ended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Wifi className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Stream Key</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyStreamKey}
                className="gap-2 text-xs"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <code className="text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-lg block truncate font-mono">
              {stream.youtube_stream_key.slice(0, 12)}••••••••••••
            </code>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              Use this key in OBS, Streamlabs, or streaming software
            </p>
          </motion.div>
        )}

        {/* Scheduled Info */}
        {stream.stream_status === 'scheduled' && stream.scheduled_start && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/20"
          >
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <span className="font-semibold">Scheduled for</span>
            </div>
            <p className="text-xl font-bold">
              {format(new Date(stream.scheduled_start), "EEEE, MMMM d 'at' h:mm a")}
            </p>
          </motion.div>
        )}

        {/* Chat Status */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Live Chat</span>
          </div>
          <Badge 
            variant={stream.chat_enabled ? "default" : "secondary"}
            className={stream.chat_enabled ? "bg-green-500/20 text-green-600 border-green-500/30" : ""}
          >
            {stream.chat_enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {stream.stream_status === 'scheduled' || stream.stream_status === 'preparing' ? (
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="w-full gap-3 h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-xl shadow-red-500/25"
                onClick={handleGoLive}
                disabled={startStream.isPending}
              >
                <Play className="h-5 w-5" />
                Go Live Now
              </Button>
            </motion.div>
          ) : stream.stream_status === 'live' ? (
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="destructive"
                className="w-full gap-3 h-14 text-base font-bold rounded-2xl shadow-xl"
                onClick={handleEndStream}
                disabled={endStream.isPending}
              >
                <Square className="h-5 w-5" />
                End Stream
              </Button>
            </motion.div>
          ) : null}

          {stream.video_id && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon"
                className="h-14 w-14 rounded-2xl"
                asChild
              >
                <a 
                  href={`https://youtube.com/watch?v=${stream.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Recording Available */}
        {stream.stream_status === 'ended' && stream.is_recording_available && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-green-500/15 via-green-500/5 to-transparent border border-green-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-500/20">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  Recording Available
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your stream has been saved to YouTube
                </p>
              </div>
              {stream.recording_url && (
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={stream.recording_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
