import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Youtube, ExternalLink, RefreshCw, Unlink, CheckCircle2, AlertCircle, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface YouTubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
  subscriber_count?: number;
  is_live_enabled: boolean;
  expires_at: string;
  is_active: boolean;
}

interface YouTubeChannelCardProps {
  workspaceId: string;
  channel?: YouTubeChannel | null;
  isLoading?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

export function YouTubeChannelCard({
  workspaceId: _workspaceId,
  channel,
  isLoading,
  onConnect,
  onDisconnect,
  onRefresh,
}: YouTubeChannelCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // In production, this would redirect to OAuth flow
      // For now, simulate the flow
      toast.info('YouTube OAuth flow would open here');
      onConnect?.();
    } catch (error) {
      toast.error('Failed to connect YouTube channel');
    } finally {
      setIsConnecting(false);
    }
  };

  const isTokenExpiring = channel?.expires_at 
    ? new Date(channel.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000 
    : false;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-700" />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!channel) {
    return (
      <Card className="overflow-hidden border-dashed">
        <div className="h-2 bg-gradient-to-r from-red-500/50 to-red-700/50" />
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-4 rounded-full bg-red-500/10 mb-4">
              <Youtube className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Connect YouTube Channel</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Link your YouTube channel to enable live streaming directly from your event dashboard
            </p>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4" />
              )}
              Connect YouTube
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-700" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">YouTube Channel</CardTitle>
            </div>
            <Badge 
              variant={channel.is_active ? "default" : "secondary"}
              className={channel.is_active ? "bg-green-500/20 text-green-600 border-green-500/30" : ""}
            >
              {channel.is_active ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                'Disconnected'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel Info */}
          <div className="flex items-center gap-4">
            {channel.channel_thumbnail ? (
              <img 
                src={channel.channel_thumbnail} 
                alt={channel.channel_name}
                className="w-14 h-14 rounded-full ring-2 ring-red-500/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <Youtube className="h-6 w-6 text-red-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{channel.channel_name}</h4>
              {channel.subscriber_count !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {channel.subscriber_count.toLocaleString()} subscribers
                </p>
              )}
            </div>
            <a 
              href={`https://youtube.com/channel/${channel.channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            {channel.is_live_enabled ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Wifi className="h-3 w-3 mr-1" />
                Live Streaming Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Live Streaming Disabled
              </Badge>
            )}
            {isTokenExpiring && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Token Expiring Soon
              </Badge>
            )}
          </div>

          {/* Token Expiry Warning */}
          {isTokenExpiring && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600">
                Your connection expires on {format(new Date(channel.expires_at), 'MMM d, yyyy')}. 
                Please refresh your connection to continue streaming.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Token
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDisconnect}
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
