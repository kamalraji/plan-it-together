import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { History, RotateCcw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DocumentVersion } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';

interface DocumentVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: DocumentVersion[];
  onFetchVersions: () => void;
  onRestoreVersion: (version: DocumentVersion) => void;
}

export function DocumentVersionHistory({
  open,
  onOpenChange,
  versions,
  onFetchVersions,
  onRestoreVersion,
}: DocumentVersionHistoryProps) {
  useEffect(() => {
    if (open) {
      onFetchVersions();
    }
  }, [open, onFetchVersions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No versions saved yet</p>
              <p className="text-sm mt-1">
                Save a version to track changes over time
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors',
                    index === 0 && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Version {version.version_number}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestoreVersion(version)}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
