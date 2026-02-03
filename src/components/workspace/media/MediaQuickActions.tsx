import { useState } from 'react';
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
import { AddCrewModal } from './AddCrewModal';
import { MediaUploadModal } from './MediaUploadModal';
import { ShareGalleryModal } from './ShareGalleryModal';
import { toast } from 'sonner';

interface MediaQuickActionsProps {
  workspaceId: string;
  onViewTasks?: () => void;
}

export function MediaQuickActions({ workspaceId, onViewTasks: _onViewTasks }: MediaQuickActionsProps) {
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleExportPackage = () => {
    toast.info('Preparing export package...', { description: 'This feature is coming soon' });
  };

  const handlePrintCredentials = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const actions = [
    {
      label: 'Add Crew',
      icon: UserPlus,
      variant: 'default' as const,
      onClick: () => setShowAddCrewModal(true),
    },
    {
      label: 'Upload Media',
      icon: Upload,
      variant: 'outline' as const,
      onClick: () => setShowUploadModal(true),
    },
    {
      label: 'Photo Brief',
      icon: Camera,
      variant: 'outline' as const,
      onClick: () => {
        const el = document.getElementById('coverage-schedule');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
    {
      label: 'Video Brief',
      icon: Video,
      variant: 'outline' as const,
      onClick: () => {
        const el = document.getElementById('coverage-schedule');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
    {
      label: 'Export Package',
      icon: Download,
      variant: 'outline' as const,
      onClick: handleExportPackage,
    },
    {
      label: 'Share Gallery',
      icon: Share2,
      variant: 'outline' as const,
      onClick: () => setShowShareModal(true),
    },
    {
      label: 'Print Credentials',
      icon: Printer,
      variant: 'outline' as const,
      onClick: handlePrintCredentials,
    },
    {
      label: 'Shot List',
      icon: FileText,
      variant: 'ghost' as const,
      onClick: () => {
        const el = document.getElementById('deliverables');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
  ];

  return (
    <>
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

      {/* Modals */}
      <AddCrewModal
        open={showAddCrewModal}
        onOpenChange={setShowAddCrewModal}
        workspaceId={workspaceId}
      />
      <MediaUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        workspaceId={workspaceId}
      />
      <ShareGalleryModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        workspaceId={workspaceId}
      />
    </>
  );
}
