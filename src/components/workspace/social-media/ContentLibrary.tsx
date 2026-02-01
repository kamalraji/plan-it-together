import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Image, Video, FileText, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ContentItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'template' | 'graphic';
  category: string;
  usedCount: number;
  lastUsed: string;
}

export function ContentLibrary() {
  const contentItems: ContentItem[] = [
    { id: '1', name: 'Event Logo Pack', type: 'graphic', category: 'Branding', usedCount: 45, lastUsed: '2026-01-05' },
    { id: '2', name: 'Speaker Templates', type: 'template', category: 'Templates', usedCount: 28, lastUsed: '2026-01-04' },
    { id: '3', name: 'Promo Video 1', type: 'video', category: 'Videos', usedCount: 12, lastUsed: '2026-01-03' },
    { id: '4', name: 'Story Backgrounds', type: 'image', category: 'Graphics', usedCount: 67, lastUsed: '2026-01-05' },
    { id: '5', name: 'Countdown Posts', type: 'template', category: 'Templates', usedCount: 15, lastUsed: '2026-01-02' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'graphic':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-pink-500/10 text-pink-500';
      case 'video':
        return 'bg-red-500/10 text-red-500';
      case 'graphic':
        return 'bg-violet-500/10 text-violet-500';
      default:
        return 'bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Content Library
          </CardTitle>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content..." className="pl-8 h-9" />
        </div>
        
        <div className="space-y-2">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Used {item.usedCount} times
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" className="w-full" size="sm">
          Browse All Assets
        </Button>
      </CardContent>
    </Card>
  );
}
