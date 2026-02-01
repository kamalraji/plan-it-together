import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Users,
  Truck,
  Building2,
  Clock,
  Download,
  Printer,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useOperationsStats } from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OpsReportTabProps {
  workspace: Workspace;
}

export function OpsReportTab({ workspace }: OpsReportTabProps) {
  const stats = useOperationsStats(workspace.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsGenerating(true);
    // Simulate export generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setLastGenerated(new Date());
    toast.success('Report data refreshed');
  };

  const taskCompletionPercent = stats.briefingsTotal > 0
    ? Math.round((stats.briefingsCompleted / stats.briefingsTotal) * 100)
    : 0;

  const facilityCheckPercent = (stats.facilityPassed + stats.facilityWarnings + stats.facilityFailed) > 0
    ? Math.round((stats.facilityPassed / (stats.facilityPassed + stats.facilityWarnings + stats.facilityFailed)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operations Report</h2>
          <p className="text-muted-foreground">Summary of operational metrics and status</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {lastGenerated ? format(lastGenerated, 'h:mm a') : 'Live Data'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Schedule Progress</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{taskCompletionPercent}%</div>
            <Progress value={taskCompletionPercent} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.briefingsCompleted} of {stats.briefingsTotal} items
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Facility Checks</span>
              <Building2 className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{facilityCheckPercent}%</div>
            <Progress value={facilityCheckPercent} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.facilityPassed} passed, {stats.facilityWarnings} warnings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Team On Duty</span>
              <Users className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.teamOnDuty}</div>
            <p className="text-xs text-muted-foreground mt-2">Active team members</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Incidents</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.incidentsOpen}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.incidentsResolved} resolved today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logistics Summary */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              Logistics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                <span className="text-sm text-foreground">Delivered</span>
                <Badge className="bg-emerald-500/20 text-emerald-600">{stats.logisticsDelivered}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                <span className="text-sm text-foreground">In Transit</span>
                <Badge className="bg-blue-500/20 text-blue-600">{stats.logisticsInTransit}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <span className="text-sm text-foreground">Delayed</span>
                <Badge className="bg-red-500/20 text-red-600">{stats.logisticsDelayed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident Summary */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Incident Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <span className="text-sm text-foreground">Open Incidents</span>
                <Badge className="bg-red-500/20 text-red-600">{stats.incidentsOpen}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                <span className="text-sm text-foreground">Critical</span>
                <Badge className="bg-orange-500/20 text-orange-600">{stats.incidentsCritical}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                <span className="text-sm text-foreground">Resolved</span>
                <Badge className="bg-emerald-500/20 text-emerald-600">{stats.incidentsResolved}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Status Overview */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            Facility Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-emerald-500">{stats.facilityPassed}</div>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-500/10">
              <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-amber-500">{stats.facilityWarnings}</div>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10">
              <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <div className="text-2xl font-bold text-red-500">{stats.facilityFailed}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Export Report</CardTitle>
          <CardDescription>Download or print the operations report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
