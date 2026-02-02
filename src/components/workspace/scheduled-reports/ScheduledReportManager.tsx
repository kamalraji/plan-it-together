import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Users,
  Mail,
  BarChart3 
} from 'lucide-react';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { format } from 'date-fns';

interface ScheduledReportManagerProps {
  workspaceId: string;
}

const REPORT_TYPES = [
  { value: 'tasks', label: 'Task Summary', icon: FileText },
  { value: 'progress', label: 'Progress Report', icon: BarChart3 },
  { value: 'team', label: 'Team Performance', icon: Users },
  { value: 'budget', label: 'Budget Report', icon: FileText },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export function ScheduledReportManager({ workspaceId }: ScheduledReportManagerProps) {
  const { 
    reports, 
    isLoading, 
    createReport, 
    updateReport, 
    deleteReport,
    isCreating 
  } = useScheduledReports(workspaceId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    reportType: 'tasks',
    frequency: 'weekly',
    recipientEmails: '',
    includeChildren: true,
  });

  const handleCreate = async () => {
    const recipients = newReport.recipientEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e);

    await createReport({
      reportType: newReport.reportType,
      frequency: newReport.frequency,
      recipients,
      includeChildren: newReport.includeChildren,
    });

    setShowCreateDialog(false);
    setNewReport({
      reportType: 'tasks',
      frequency: 'weekly',
      recipientEmails: '',
      includeChildren: true,
    });
  };

  const handleToggle = (reportId: string, isActive: boolean) => {
    updateReport({ id: reportId, isActive });
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      deleteReport(reportId);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Automated report generation and delivery
          </CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Create Scheduled Report</DialogTitle>
              <DialogDescription>
                Set up automated report generation and delivery
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={newReport.reportType}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  placeholder="email1@example.com, email2@example.com"
                  value={newReport.recipientEmails}
                  onChange={(e) => setNewReport(prev => ({ ...prev, recipientEmails: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-children">Include sub-workspaces</Label>
                <Switch
                  id="include-children"
                  checked={newReport.includeChildren}
                  onCheckedChange={(checked) => setNewReport(prev => ({ ...prev, includeChildren: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scheduled reports yet</p>
            <p className="text-xs mt-1">Create one to automate your reporting</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const ReportIcon = REPORT_TYPES.find(t => t.value === report.reportType)?.icon || FileText;
              
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ReportIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {REPORT_TYPES.find(t => t.value === report.reportType)?.label || report.reportType}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {FREQUENCIES.find(f => f.value === report.frequency)?.label}
                        </Badge>
                        {!report.isActive && (
                          <Badge variant="secondary" className="text-xs">Paused</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {report.nextRunAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Next: {format(new Date(report.nextRunAt), 'MMM d, h:mm a')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.isActive}
                      onCheckedChange={(checked) => handleToggle(report.id, checked)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
