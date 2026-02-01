import { useState } from 'react';
import { useAutomationRules } from '@/hooks/useAutomationRules';
import { AutomationRule, TRIGGER_INFO, ACTION_INFO, AUTOMATION_PRESETS } from '@/lib/automationTypes';
import { AutomationRuleBuilder } from './AutomationRuleBuilder';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  Zap, Plus, Trash2, Settings2, History, ArrowRight,
  Clock, Link, RefreshCw, CheckSquare, AlertTriangle, UserPlus, UserMinus,
  Bell, UserCheck, Flag, Tag, XCircle, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AutomationRulesPanelProps {
  workspaceId: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Clock: <Clock className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
  RefreshCw: <RefreshCw className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  UserMinus: <UserMinus className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  UserCheck: <UserCheck className="h-4 w-4" />,
  Flag: <Flag className="h-4 w-4" />,
  Tag: <Tag className="h-4 w-4" />,
  XCircle: <XCircle className="h-4 w-4" />,
  Ban: <Ban className="h-4 w-4" />,
};

export function AutomationRulesPanel({ workspaceId }: AutomationRulesPanelProps) {
  const { rules, isLoading, executionLogs, toggleRule, deleteRule, createRule, isCreating } = useAutomationRules(workspaceId);
  const [showBuilder, setShowBuilder] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  const handleCreateFromPreset = (preset: typeof AUTOMATION_PRESETS[0]) => {
    createRule({
      name: preset.name,
      description: preset.description,
      triggerType: preset.triggerType,
      triggerConfig: preset.triggerConfig,
      actionType: preset.actionType,
      actionConfig: preset.actionConfig,
    });
  };

  const enabledCount = rules.filter(r => r.isEnabled).length;
  const recentSuccessCount = executionLogs.filter(l => l.success).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Automation Rules</h3>
            <p className="text-sm text-muted-foreground">
              {enabledCount} active rules • {recentSuccessCount} recent executions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Zap className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-2">No automation rules yet</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Create rules to automate task status changes, notifications, and assignments.
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={(enabled) => toggleRule(rule.id, enabled)}
                  onDelete={() => setRuleToDelete(rule.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {AUTOMATION_PRESETS.map((preset, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{preset.name}</CardTitle>
                  <CardDescription>{preset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Badge variant="outline" className="gap-1">
                      {iconMap[TRIGGER_INFO[preset.triggerType].icon]}
                      {TRIGGER_INFO[preset.triggerType].label}
                    </Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline" className="gap-1">
                      {iconMap[ACTION_INFO[preset.actionType].icon]}
                      {ACTION_INFO[preset.actionType].label}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCreateFromPreset(preset)}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {executionLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No automation executions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {executionLogs.slice(0, 20).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      log.success ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium">{log.actionTaken}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.triggeredAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {!log.success && log.errorMessage && (
                    <Badge variant="destructive" className="text-xs">
                      {log.errorMessage.slice(0, 30)}...
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rule Builder Dialog */}
      <AutomationRuleBuilder
        open={showBuilder}
        onOpenChange={setShowBuilder}
        workspaceId={workspaceId}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Delete automation rule"
        description="This will permanently delete the automation rule. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (ruleToDelete) {
            deleteRule(ruleToDelete);
            setRuleToDelete(null);
          }
        }}
      />
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const triggerInfo = TRIGGER_INFO[rule.triggerType];
  const actionInfo = ACTION_INFO[rule.actionType];

  return (
    <Card className={cn(!rule.isEnabled && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium">{rule.name}</h4>
              <Badge variant={rule.isEnabled ? 'default' : 'secondary'}>
                {rule.isEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            {rule.description && (
              <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="gap-1">
                {iconMap[triggerInfo.icon]}
                {triggerInfo.label}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="gap-1">
                {iconMap[actionInfo.icon]}
                {actionInfo.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isEnabled}
              onCheckedChange={onToggle}
            />
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
