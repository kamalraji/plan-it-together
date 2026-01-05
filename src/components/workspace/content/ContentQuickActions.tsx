import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  PenSquare, 
  Upload, 
  Calendar, 
  Share2, 
  FileText,
  Image,
  Video,
  UserPlus
} from 'lucide-react';

interface ContentQuickActionsProps {
  onCreatePost?: () => void;
  onUploadMedia?: () => void;
  onScheduleContent?: () => void;
  onWriteArticle?: () => void;
  onRegisterSpeaker?: () => void;
}

export function ContentQuickActions({
  onCreatePost,
  onUploadMedia,
  onScheduleContent,
  onWriteArticle,
  onRegisterSpeaker,
}: ContentQuickActionsProps) {
  const actions = [
    {
      label: 'Create Post',
      description: 'Draft a new social media post',
      icon: PenSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
      onClick: onCreatePost,
    },
    {
      label: 'Upload Media',
      description: 'Add images or videos',
      icon: Upload,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
      onClick: onUploadMedia,
    },
    {
      label: 'Schedule Content',
      description: 'Plan upcoming posts',
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      onClick: onScheduleContent,
    },
    {
      label: 'Write Article',
      description: 'Start a new blog post',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
      onClick: onWriteArticle,
    },
    {
      label: 'Add Speaker',
      description: 'Register a new speaker',
      icon: UserPlus,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      onClick: onRegisterSpeaker,
    },
  ];

  const mediaShortcuts = [
    { label: 'Add Image', icon: Image, color: 'text-pink-500' },
    { label: 'Add Video', icon: Video, color: 'text-red-500' },
    { label: 'Share Link', icon: Share2, color: 'text-sky-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`h-auto p-3 flex flex-col items-start gap-1 ${action.bgColor} border-0`}
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="font-medium text-sm">{action.label}</span>
              <span className="text-xs text-muted-foreground text-left">
                {action.description}
              </span>
            </Button>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Media shortcuts</p>
          <div className="flex gap-2">
            {mediaShortcuts.map((shortcut) => (
              <Button
                key={shortcut.label}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                <shortcut.icon className={`h-3 w-3 mr-1 ${shortcut.color}`} />
                {shortcut.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
