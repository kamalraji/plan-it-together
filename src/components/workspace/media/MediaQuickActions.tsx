import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  UserPlus, 
  Upload, 
  Download, 
  Camera,
  Video,
  Share2,
  FileText,
  Printer
} from 'lucide-react';

interface MediaQuickActionsProps {
  workspaceId?: string;
  onViewTasks?: () => void;
}

export function MediaQuickActions(_props: MediaQuickActionsProps) {
  const actions = [
    {
      label: 'Add Crew',
      icon: UserPlus,
      variant: 'default' as const,
      onClick: () => { /* TODO: Open add crew dialog */ },
    },
    {
      label: 'Upload Media',
      icon: Upload,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Open media upload dialog */ },
    },
    {
      label: 'Photo Brief',
      icon: Camera,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Navigate to photo brief */ },
    },
    {
      label: 'Video Brief',
      icon: Video,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Navigate to video brief */ },
    },
    {
      label: 'Export Package',
      icon: Download,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Trigger export */ },
    },
    {
      label: 'Share Gallery',
      icon: Share2,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Open share dialog */ },
    },
    {
      label: 'Print Credentials',
      icon: Printer,
      variant: 'outline' as const,
      onClick: () => { /* TODO: Open print dialog */ },
    },
    {
      label: 'Shot List',
      icon: FileText,
      variant: 'ghost' as const,
      onClick: () => { /* TODO: Navigate to shot list */ },
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              className="justify-start gap-2 h-auto py-2.5"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
