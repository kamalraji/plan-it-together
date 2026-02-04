import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Hash, 
  Send, 
  Megaphone, 
  Lock,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useRealtimeMessages, ChannelMessage } from '@/hooks/useRealtimeMessages';
import { useMyParticipantChannels } from '@/hooks/useParticipantChannels';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParticipantChannelViewProps {
  eventId: string;
  onBack?: () => void;
}

interface MyChannel {
  id: string;
  name: string;
  description: string | null;
  type: string;
  canRead: boolean;
  canWrite: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  announcement: <Megaphone className="h-4 w-4" />,
  general: <Hash className="h-4 w-4" />,
  private: <Lock className="h-4 w-4" />,
  task: <Hash className="h-4 w-4" />,
};

export function ParticipantChannelView({ eventId, onBack }: ParticipantChannelViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<MyChannel | null>(null);
  const { data: channels = [], isLoading } = useMyParticipantChannels(eventId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <CardTitle className="text-lg">Event Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No channels available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Channels will appear here once the organizers set them up
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedChannel) {
    return (
      <ChannelMessageView
        channel={selectedChannel}
        onBack={() => setSelectedChannel(null)}
      />
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Event Channels
          </CardTitle>
          <Badge variant="secondary">{channels.length} channels</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  channel.type === 'announcement' 
                    ? 'bg-amber-500/10 text-amber-600' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {typeIcons[channel.type] || <Hash className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {channel.description || `${channel.type} channel`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!channel.canWrite && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Read-only
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChannelMessageViewProps {
  channel: MyChannel;
  onBack: () => void;
}

function ChannelMessageView({ channel, onBack }: ChannelMessageViewProps) {
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, sendMessage } = useRealtimeMessages({
    channelId: channel.id,
  });

  // Get current user's name
  useEffect(() => {
    async function fetchUserName() {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', userData.user.id)
          .single();
        setUserName(profile?.full_name || 'Anonymous');
      }
    }
    fetchUserName();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !channel.canWrite) return;
    
    try {
      await sendMessage(message.trim(), userName || 'Anonymous');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-border/50 flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={`p-2 rounded-lg ${
            channel.type === 'announcement' 
              ? 'bg-amber-500/10 text-amber-600' 
              : 'bg-primary/10 text-primary'
          }`}>
            {typeIcons[channel.type] || <Hash className="h-4 w-4" />}
          </div>
          <div>
            <CardTitle className="text-lg">{channel.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {channel.description || `${channel.type} channel`}
            </p>
          </div>
          {!channel.canWrite && (
            <Badge variant="outline" className="ml-auto">
              <Lock className="h-3 w-3 mr-1" />
              Read-only
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              {channel.canWrite && (
                <p className="text-sm mt-1">Be the first to say something!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {channel.canWrite ? (
        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder={`Message #${channel.name}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t bg-muted/30 text-center text-sm text-muted-foreground shrink-0">
          <Lock className="h-4 w-4 inline-block mr-2" />
          This channel is read-only for participants
        </div>
      )}
    </Card>
  );
}

interface MessageBubbleProps {
  message: ChannelMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const initials = message.sender_name
    ? message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">
            {message.sender_name || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="text-sm mt-0.5 break-words">{message.content}</p>
      </div>
    </div>
  );
}
