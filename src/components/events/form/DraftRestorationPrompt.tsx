import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface DraftRestorationPromptProps {
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

export function DraftRestorationPrompt({
  onRestore,
  onDiscard,
  className,
}: DraftRestorationPromptProps) {
  return (
    <Alert 
      className={cn(
        "border-primary/50 bg-primary/5",
        className
      )}
    >
      <FileText className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm font-medium">Draft found</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          You have an unsaved draft from a previous session. Would you like to continue where you left off?
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onRestore} className="h-8">
            Restore draft
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDiscard}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Discard
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
