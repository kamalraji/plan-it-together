import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, ArrowRight } from 'lucide-react';

interface DelegatedSettingInfo {
  settingLabel: string;
  workspaceName: string;
  workspaceType: string;
  isComplete: boolean;
}

interface DelegatedSettingsAlertProps {
  incompleteSettings: DelegatedSettingInfo[];
}

/**
 * Alert shown to ROOT workspace when delegated settings are incomplete.
 * Helps identify which child workspaces need to complete their assigned settings.
 */
export const DelegatedSettingsAlert: React.FC<DelegatedSettingsAlertProps> = ({
  incompleteSettings,
}) => {
  if (incompleteSettings.length === 0) {
    return null;
  }

  // Group by workspace
  const groupedByWorkspace = incompleteSettings.reduce((acc, setting) => {
    const key = setting.workspaceName;
    if (!acc[key]) {
      acc[key] = {
        workspaceName: setting.workspaceName,
        workspaceType: setting.workspaceType,
        settings: [],
      };
    }
    acc[key].settings.push(setting.settingLabel);
    return acc;
  }, {} as Record<string, { workspaceName: string; workspaceType: string; settings: string[] }>);

  const workspaces = Object.values(groupedByWorkspace);

  return (
    <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-700 dark:text-yellow-400">
        Delegated Settings Incomplete
      </AlertTitle>
      <AlertDescription className="text-yellow-700/80 dark:text-yellow-400/80">
        <p className="mb-3">
          Some settings delegated to child workspaces are not yet complete. 
          Contact the responsible workspace leads to complete these before publishing.
        </p>
        <div className="space-y-2">
          {workspaces.map(({ workspaceName, workspaceType, settings }) => (
            <div 
              key={workspaceName}
              className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
            >
              <Users className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{workspaceName}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {workspaceType.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <ArrowRight className="h-3 w-3" />
                  <span>{settings.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};
