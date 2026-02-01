import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { formatDistanceToNow } from 'date-fns';
import { History, RotateCcw, Eye, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LandingPageVersion {
  id: string;
  event_id: string;
  version_number: number;
  landing_page_data: {
    html: string;
    css: string;
    meta?: { title?: string; description?: string };
  };
  created_by: string | null;
  created_at: string;
  label: string | null;
}

interface VersionHistoryProps {
  eventId: string;
  onPreview?: (data: { html: string; css: string }) => void;
  onRestore?: (data: { html: string; css: string }) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  eventId,
  onPreview,
  onRestore,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<LandingPageVersion | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['landing-page-versions', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('version_number', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LandingPageVersion[];
    },
    enabled: !!eventId && isExpanded,
  });

  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('landing_page_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-versions', eventId] });
      toast({ title: 'Version deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete version', variant: 'destructive' });
    },
  });

  const handleRestore = () => {
    if (!restoreVersion) return;
    
    onRestore?.({
      html: restoreVersion.landing_page_data.html,
      css: restoreVersion.landing_page_data.css,
    });
    
    toast({
      title: 'Version restored',
      description: `Version ${restoreVersion.version_number} loaded into editor. Publish to make it live.`,
    });
    
    setRestoreVersion(null);
  };

  return (
    <div className="border-t border-[var(--gjs-border)] pt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)] rounded-md transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        )}
        <History className="h-4 w-4 text-[var(--gjs-accent)]" />
        <span>Version History</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--gjs-text-muted)]" />
            </div>
          ) : versions && versions.length > 0 ? (
            versions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                onPreview={() =>
                  onPreview?.({
                    html: version.landing_page_data.html,
                    css: version.landing_page_data.css,
                  })
                }
                onRestore={() => setRestoreVersion(version)}
                onDelete={() => deleteVersionMutation.mutate(version.id)}
                isDeleting={deleteVersionMutation.isPending}
              />
            ))
          ) : (
            <p className="px-2 py-4 text-center text-xs text-[var(--gjs-text-muted)]">
              No versions yet. Versions are created when you publish.
            </p>
          )}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreVersion} onOpenChange={() => setRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {restoreVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current draft with this version. You'll need to publish to make it live.
              {restoreVersion?.label && (
                <span className="block mt-2 font-medium">
                  Label: "{restoreVersion.label}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface VersionItemProps {
  version: LandingPageVersion;
  onPreview: () => void;
  onRestore: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  onPreview,
  onRestore,
  onDelete,
  isDeleting,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center justify-between px-2 py-1.5 rounded-md transition-colors',
        'hover:bg-[var(--gjs-bg-hover)]'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--gjs-text-primary)]">
            v{version.version_number}
          </span>
          {version.label && (
            <span className="text-xs text-[var(--gjs-accent)] truncate">
              {version.label}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[var(--gjs-text-muted)]">
          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex items-center gap-0.5 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreview}
          className="h-6 w-6 text-[var(--gjs-text-muted)] hover:text-[var(--gjs-text-primary)]"
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestore}
          className="h-6 w-6 text-[var(--gjs-text-muted)] hover:text-[var(--gjs-accent)]"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-6 w-6 text-[var(--gjs-text-muted)] hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
