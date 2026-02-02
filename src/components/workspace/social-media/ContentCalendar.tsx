import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, Image, Video, FileText } from 'lucide-react';

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  platformIcon: string;
  type: 'image' | 'video' | 'text' | 'carousel';
  scheduledTime: string;
  status: 'scheduled' | 'draft' | 'published' | 'failed';
}

export function ContentCalendar() {
  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      title: 'Speaker spotlight: Dr. Jane Smith',
      platform: 'Instagram',
      platformIcon: '📷',
      type: 'carousel',
      scheduledTime: '2026-01-06 09:00',
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Early bird tickets ending soon!',
      platform: 'Twitter/X',
      platformIcon: '𝕏',
      type: 'image',
      scheduledTime: '2026-01-06 12:00',
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Behind the scenes prep video',
      platform: 'TikTok',
      platformIcon: '🎵',
      type: 'video',
      scheduledTime: '2026-01-06 18:00',
      status: 'draft',
    },
    {
      id: '4',
      title: 'Workshop announcement thread',
      platform: 'LinkedIn',
      platformIcon: '💼',
      type: 'text',
      scheduledTime: '2026-01-07 10:00',
      status: 'scheduled',
    },
    {
      id: '5',
      title: 'Venue tour video',
      platform: 'Instagram',
      platformIcon: '📷',
      type: 'video',
      scheduledTime: '2026-01-07 14:00',
      status: 'scheduled',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'carousel':
        return <Image className="h-3 w-3" />;
      case 'video':
        return <Video className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'published':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Content Calendar
          </CardTitle>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Schedule Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduledPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
                {post.platformIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatTime(post.scheduledTime)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {getTypeIcon(post.type)}
                  {post.type}
                </Badge>
                <Badge className={`text-xs capitalize ${getStatusColor(post.status)}`}>
                  {post.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-3" size="sm">
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
