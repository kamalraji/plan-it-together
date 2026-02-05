import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Clock, CheckCircle2, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduledReport {
  id: string;
  workspace_id: string;
  report_type: string;
  frequency: string;
  recipients: string[];
  next_run_at: string | null;
  last_run_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface ReportHistoryViewerProps {
  workspaceId: string;
  className?: string;
}

export const ReportHistoryViewer: React.FC<ReportHistoryViewerProps> = ({
  workspaceId,
  className,
}) => {
  const { data: reports, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['scheduled-reports', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScheduledReport[];
    },
    enabled: !!workspaceId,
  });

  const getStatusIcon = (report: ScheduledReport) => {
    if (!report.is_active) {
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
    if (report.last_run_at) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    return <Clock className="h-4 w-4 text-warning" />;
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (!report.is_active) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    if (report.last_run_at) {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const formatReportType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatFrequency = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
    };
    return labels[frequency] || frequency;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            View scheduled and previously generated reports
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No scheduled reports</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Configure scheduled reports to see them here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(report)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {formatReportType(report.report_type)}
                        </span>
                        {getStatusBadge(report)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatFrequency(report.frequency)}</span>
                      </div>
                      {report.last_run_at && (
                        <p className="text-xs text-muted-foreground">
                          Last run: {formatDistanceToNow(new Date(report.last_run_at), { addSuffix: true })}
                        </p>
                      )}
                      {report.next_run_at && (
                        <p className="text-xs text-muted-foreground/70">
                          Next run: {format(new Date(report.next_run_at), 'PPp')}
                        </p>
                      )}
                      {report.recipients && report.recipients.length > 0 && (
                        <p className="text-xs text-muted-foreground/60">
                          {report.recipients.length} recipient(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportHistoryViewer;
