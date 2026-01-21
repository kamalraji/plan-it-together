import { CheckCircle, AlertCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/useEventPublish';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface EventPublishChecklistProps {
  items: ChecklistItem[];
  canPublish: boolean;
  warningCount: number;
  failCount: number;
  onNavigateToSetting?: (tab: string) => void;
}

export function EventPublishChecklist({ 
  items, 
  warningCount, 
  failCount,
  onNavigateToSetting,
}: EventPublishChecklistProps) {
  const [basicOpen, setBasicOpen] = useState(true);
  const [eventSpaceOpen, setEventSpaceOpen] = useState(true);

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBg = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'fail':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  // Group items by category
  const basicItems = items.filter(i => i.category === 'basic' || !i.category);
  const eventSpaceItems = items.filter(i => i.category === 'event-space');

  const renderItem = (item: ChecklistItem) => (
    <div 
      key={item.id}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        getStatusBg(item.status)
      )}
    >
      {getStatusIcon(item.status)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {item.label}
          </span>
          {item.required && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Required
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {item.description}
        </p>
      </div>
      {item.status !== 'pass' && item.settingsTab && onNavigateToSetting && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 gap-1"
          onClick={() => onNavigateToSetting(item.settingsTab!)}
        >
          Configure
          <ExternalLink className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={cn(
        'rounded-lg border p-4',
        failCount === 0 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-yellow-500/10 border-yellow-500/20'
      )}>
        <div className="flex items-center gap-3">
          {failCount === 0 ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          )}
          <div>
            <p className={cn(
              'font-medium',
              failCount === 0 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
            )}>
              {failCount === 0 
                ? 'All checks passed - Ready to Publish' 
                : `${failCount} issue${failCount > 1 ? 's' : ''} to review before publishing`}
            </p>
            {warningCount > 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {warningCount} warning{warningCount > 1 ? 's' : ''} to consider
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information Category */}
      {basicItems.length > 0 && (
        <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50">
            <span className="text-sm font-medium">Basic Information</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", basicOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {basicItems.map(renderItem)}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Event Space Settings Category */}
      {eventSpaceItems.length > 0 && (
        <Collapsible open={eventSpaceOpen} onOpenChange={setEventSpaceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50">
            <span className="text-sm font-medium">Event Space Settings</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", eventSpaceOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {eventSpaceItems.map(renderItem)}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Required items must pass before publishing. Optional items are recommendations 
          that can help improve your event's visibility and organization.
        </p>
      </div>
    </div>
  );
}
