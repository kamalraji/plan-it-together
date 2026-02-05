import React from 'react';
import { useEventPublish } from '@/hooks/useEventPublish';
import { useRootPublishRequirements } from '@/hooks/useRootPublishRequirements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Layout, 
  Ticket, 
  Search, 
  Accessibility,
  ClipboardCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContributeToPublishCardProps {
  eventId: string;
  assignedSettings: string[]; // ['ticketing', 'seo', etc.]
  onNavigateToSetting?: (settingKey: string) => void;
}

const SETTING_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  ticketing: { label: 'Ticketing & Registration', icon: Ticket },
  promo_codes: { label: 'Promo Codes', icon: Ticket },
  seo: { label: 'SEO Settings', icon: Search },
  accessibility: { label: 'Accessibility', icon: Accessibility },
  landing_page: { label: 'Landing Page', icon: Layout },
};

/**
 * Card for child workspaces showing their assigned settings and completion status.
 * Helps track contribution to publish readiness.
 */
export const ContributeToPublishCard: React.FC<ContributeToPublishCardProps> = ({
  eventId,
  assignedSettings,
  onNavigateToSetting,
}) => {
  const { checklist, isLoading: checklistLoading } = useEventPublish(eventId);
  const { data: rootData, isLoading: rootLoading } = useRootPublishRequirements(eventId);

  const isLoading = checklistLoading || rootLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (assignedSettings.length === 0) {
    return null;
  }

  // Map assigned settings to checklist items
  const settingsWithStatus = assignedSettings.map(settingKey => {
    // Find matching checklist item
    const checklistItem = checklist.items.find(item => {
      if (settingKey === 'ticketing' && item.id === 'ticketing') return true;
      if (settingKey === 'seo' && item.id === 'seo') return true;
      if (settingKey === 'accessibility' && item.id === 'accessibility') return true;
      if (settingKey === 'landing_page' && item.id === 'landing-page') return true;
      if (settingKey === 'promo_codes' && item.id === 'promo-codes') return true;
      return false;
    });

    const config = SETTING_CONFIG[settingKey] || { label: settingKey, icon: ClipboardCheck };
    const publishRequirements = rootData?.publishRequirements;
    
    // Determine if this setting is required
    let isRequired = false;
    if (publishRequirements) {
      if (settingKey === 'ticketing') isRequired = publishRequirements.requireTicketingConfig;
      if (settingKey === 'seo') isRequired = publishRequirements.requireSEO;
      if (settingKey === 'accessibility') isRequired = publishRequirements.requireAccessibility;
      if (settingKey === 'landing_page') isRequired = publishRequirements.requireLandingPage;
    }

    return {
      key: settingKey,
      label: config.label,
      icon: config.icon,
      status: checklistItem?.status || 'warning',
      description: checklistItem?.description || 'Configure this setting',
      isRequired,
    };
  });

  const completedCount = settingsWithStatus.filter(s => s.status === 'pass').length;
  const totalCount = settingsWithStatus.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-info/20 bg-info/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-sm font-medium">Your Publishing Contributions</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {completedCount} of {totalCount} assigned setting{totalCount !== 1 ? 's' : ''} complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Assigned Settings */}
        <div className="space-y-2">
          {settingsWithStatus.map(({ key, label, icon: Icon, status, description, isRequired }) => (
            <div 
              key={key}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg',
                status === 'pass' && 'bg-success/10',
                status === 'warning' && 'bg-warning/10',
                status === 'fail' && 'bg-destructive/10',
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{label}</span>
                  {isRequired && (
                    <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              {getStatusIcon(status)}
              {status !== 'pass' && onNavigateToSetting && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 shrink-0"
                  onClick={() => onNavigateToSetting(key)}
                >
                  Configure
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* All Complete Message */}
        {completedCount === totalCount && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>All assigned settings are complete!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
