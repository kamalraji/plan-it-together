import { 
  Layout, 
  Ticket, 
  Search, 
  Accessibility, 
  Tags,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EventSettingsReadiness, PublishRequirements } from '@/types/eventPublishReadiness';

interface SettingsCompletionProgressProps {
  readiness: EventSettingsReadiness;
  requirements: PublishRequirements;
  onNavigateToSetting?: (tab: string) => void;
  compact?: boolean;
}

interface SettingItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  tab: string;
  getStatus: (readiness: EventSettingsReadiness) => boolean;
  getRequired: (requirements: PublishRequirements) => boolean;
}

const SETTING_ITEMS: SettingItemConfig[] = [
  {
    id: 'landing-page',
    label: 'Landing Page',
    icon: Layout,
    tab: 'landing-page',
    getStatus: (r) => r.landingPage.configured && r.landingPage.hasContent,
    getRequired: (req) => req.requireLandingPage,
  },
  {
    id: 'ticketing',
    label: 'Ticketing',
    icon: Ticket,
    tab: 'ticketing',
    getStatus: (r) => r.ticketing.configured,
    getRequired: (req) => req.requireTicketingConfig,
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    tab: 'seo',
    getStatus: (r) => r.seo.configured && r.seo.hasMetaDescription,
    getRequired: (req) => req.requireSEO,
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: Accessibility,
    tab: 'accessibility',
    getStatus: (r) => r.accessibility.configured && r.accessibility.hasLanguage,
    getRequired: (req) => req.requireAccessibility,
  },
  {
    id: 'promo-codes',
    label: 'Promo Codes',
    icon: Tags,
    tab: 'promo-codes',
    getStatus: (r) => r.promoCodes.hasActiveCodes || r.promoCodes.codeCount > 0,
    getRequired: () => false, // Always optional
  },
];

export function SettingsCompletionProgress({
  readiness,
  requirements,
  onNavigateToSetting,
  compact = false,
}: SettingsCompletionProgressProps) {
  // Calculate completion percentage based on required items
  const requiredItems = SETTING_ITEMS.filter(item => item.getRequired(requirements));
  const completedRequired = requiredItems.filter(item => item.getStatus(readiness)).length;
  const allCompleted = SETTING_ITEMS.filter(item => item.getStatus(readiness)).length;
  
  const overallPercentage = Math.round((allCompleted / SETTING_ITEMS.length) * 100);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Settings Completion</span>
          <span className="font-medium">{overallPercentage}%</span>
        </div>
        <Progress value={overallPercentage} className="h-2" />
        <div className="flex flex-wrap gap-2">
          {SETTING_ITEMS.map((item) => {
            const isComplete = item.getStatus(readiness);
            const isRequired = item.getRequired(requirements);
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                  isComplete 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : isRequired 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                      : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
                {isComplete && <CheckCircle className="h-3 w-3" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Event Space Settings</span>
          <span className="text-sm text-muted-foreground">
            {allCompleted}/{SETTING_ITEMS.length} complete
          </span>
        </div>
        <Progress value={overallPercentage} className="h-2" />
        {requiredItems.length > 0 && completedRequired < requiredItems.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {requiredItems.length - completedRequired} required setting{requiredItems.length - completedRequired > 1 ? 's' : ''} incomplete
          </p>
        )}
      </div>

      {/* Individual Settings */}
      <div className="space-y-2">
        {SETTING_ITEMS.map((item) => {
          const isComplete = item.getStatus(readiness);
          const isRequired = item.getRequired(requirements);
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                isComplete 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : isRequired 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  isComplete 
                    ? 'bg-green-500/10' 
                    : isRequired 
                      ? 'bg-red-500/10' 
                      : 'bg-muted'
                )}>
                  <Icon className={cn(
                    'h-4 w-4',
                    isComplete 
                      ? 'text-green-600 dark:text-green-400' 
                      : isRequired 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {isRequired && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isComplete ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <>
                    <XCircle className={cn(
                      'h-5 w-5',
                      isRequired ? 'text-red-500' : 'text-muted-foreground'
                    )} />
                    {onNavigateToSetting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => onNavigateToSetting(item.tab)}
                      >
                        Configure
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
