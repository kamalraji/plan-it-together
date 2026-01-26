import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Square, Eye, Clock, Signal, MessageSquare, 
  Copy, ExternalLink, Settings, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';
import { LiveStream, StreamStatus } from '@/types/livestream.types';
import { useStartStream, useEndStream } from '@/hooks/useLiveStreaming';
import { cn } from '@/lib/utils';

interface StreamControlPanelProps {
  stream: LiveStream;
  workspaceId: string;
  onSettingsClick?: () => void;
}

export function StreamControlPanel({ stream, workspaceId, onSettingsClick }: StreamControlPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const startStream = useStartStream();
  const endStream = useEndStream();

  // Timer for live duration
  useEffect(() => {
    if (stream.stream_status !== 'live' || !stream.started_at) return;

    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), new Date(stream.started_at!)));
    }, 1000);

    return () => clearInterval(interval);
  }, [stream.stream_status, stream.started_at]);

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

  const getStatusConfig = (status: StreamStatus) => {
    switch (status) {
      case 'live':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'LIVE',
          pulse: true 
        };
      case 'preparing':
        return { 
          color: 'bg-yellow-500', 
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'Preparing',
          pulse: false 
        };
      case 'scheduled':
        return { 
          color: 'bg-blue-500', 
          textColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          label: 'Scheduled',
          pulse: false 
        };
      case 'ended':
        return { 
          color: 'bg-muted', 
          textColor: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
          label: 'Ended',
          pulse: false 
        };
      case 'error':
        return { 
          color: 'bg-destructive', 
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          label: 'Error',
          pulse: false 
        };
      default:
        return { 
          color: 'bg-muted', 
          textColor: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
          label: status,
          pulse: false 
        };
    }
  };

  const statusConfig = getStatusConfig(stream.stream_status);

  return (
    <Card className="overflow-hidden">
      {/* Status Bar */}
      <div className={cn("h-1.5 transition-colors", statusConfig.color)} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{stream.title || 'Untitled Stream'}</CardTitle>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1.5 font-semibold",
                statusConfig.bgColor,
                statusConfig.textColor,
                statusConfig.borderColor
              )}
            >
              {statusConfig.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
              {statusConfig.label}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live Stats */}
        <AnimatePresence mode="wait">
          {stream.stream_status === 'live' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-center gap-1.5 text-red-500 mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-2xl font-bold">{stream.viewer_count}</span>
                </div>
                <p className="text-xs text-muted-foreground">Watching Now</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-center gap-1.5 text-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-2xl font-bold font-mono">{formatDuration(elapsed)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-center gap-1.5 text-green-500 mb-1">
                  <Signal className="h-4 w-4" />
                  <span className="text-2xl font-bold">Good</span>
                </div>
                <p className="text-xs text-muted-foreground">Connection</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stream Key Section */}
        {stream.youtube_stream_key && stream.stream_status !== 'ended' && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                Stream Key
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleCopyStreamKey}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <code className="text-xs text-muted-foreground bg-background px-2 py-1 rounded block truncate">
              {stream.youtube_stream_key.slice(0, 8)}••••••••
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Use this key in OBS, Streamlabs, or other streaming software
            </p>
          </div>
        )}

        {/* Scheduled Info */}
        {stream.stream_status === 'scheduled' && stream.scheduled_start && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Scheduled for</span>
            </div>
            <p className="text-lg font-semibold">
              {format(new Date(stream.scheduled_start), "EEEE, MMMM d 'at' h:mm a")}
            </p>
          </div>
        )}

        {/* Chat Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Live Chat</span>
          </div>
          <Badge variant={stream.chat_enabled ? "default" : "secondary"}>
            {stream.chat_enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {stream.stream_status === 'scheduled' || stream.stream_status === 'preparing' ? (
            <Button 
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700 h-12 text-base"
              onClick={handleGoLive}
              disabled={startStream.isPending}
            >
              <Play className="h-5 w-5" />
              Go Live Now
            </Button>
          ) : stream.stream_status === 'live' ? (
            <Button 
              variant="destructive"
              className="flex-1 gap-2 h-12 text-base"
              onClick={handleEndStream}
              disabled={endStream.isPending}
            >
              <Square className="h-5 w-5" />
              End Stream
            </Button>
          ) : null}

          {stream.video_id && (
            <Button 
              variant="outline" 
              size="icon"
              className="h-12 w-12"
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
          )}
        </div>

        {/* Recording Available */}
        {stream.stream_status === 'ended' && stream.is_recording_available && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-600">Recording Available</p>
                <p className="text-sm text-muted-foreground">
                  Your stream has been saved to YouTube
                </p>
              </div>
              {stream.recording_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={stream.recording_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Watch
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
