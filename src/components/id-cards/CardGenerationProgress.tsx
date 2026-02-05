import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { GenerationProgress } from '@/hooks/useIDCardGeneration';

interface CardGenerationProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: GenerationProgress;
  onCancel?: () => void;
  onDownload?: () => void;
}

export function CardGenerationProgress({
  open,
  onOpenChange,
  progress,
  onCancel,
  onDownload,
}: CardGenerationProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircle2 className="h-12 w-12 text-success" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      default:
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'idle':
        return 'Waiting to start...';
      case 'preparing':
        return 'Preparing card generation...';
      case 'generating':
        return `Generating card ${progress.current} of ${progress.total}`;
      case 'composing':
        return 'Composing PDF document...';
      case 'complete':
        return 'Generation complete!';
      case 'error':
        return 'Generation failed';
      default:
        return 'Processing...';
    }
  };

  const canClose = progress.status === 'complete' || progress.status === 'error' || progress.status === 'idle';

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generating ID Cards
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8 space-y-6">
          {getStatusIcon()}
          
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{getStatusText()}</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            {progress.message && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {progress.message}
              </p>
            )}
          </div>

          {progress.status === 'complete' && (
            <div className="flex gap-3">
              <Button onClick={onDownload} className="gap-2">
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          {progress.status === 'error' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}

          {progress.status !== 'complete' && progress.status !== 'error' && progress.status !== 'idle' && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
