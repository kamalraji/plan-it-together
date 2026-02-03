import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useLogisticsReports, 
  useGenerateReport, 
  useDeleteReport,
  useLogisticsStats,
  ReportType
} from '@/hooks/useLogisticsCommitteeData';
import { 
  FileText, 
  Plus, 
  Trash2,
  Download,
  Package,
  Truck,
  MapPin,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface GenerateReportTabProps {
  workspaceId: string;
}

const reportTypeConfig: Record<ReportType, { label: string; description: string; icon: typeof FileText }> = {
  daily_summary: { 
    label: 'Daily Summary', 
    description: 'Overview of all logistics activities for today',
    icon: Calendar 
  },
  equipment_status: { 
    label: 'Equipment Status', 
    description: 'Current status of all equipment inventory',
    icon: Package 
  },
  shipment_status: { 
    label: 'Shipment Status', 
    description: 'Status of all shipments and deliveries',
    icon: Truck 
  },
  transport_summary: { 
    label: 'Transport Summary', 
    description: 'Summary of all transport schedules',
    icon: Truck 
  },
  venue_readiness: { 
    label: 'Venue Readiness', 
    description: 'Status of all venue preparations',
    icon: MapPin 
  },
  full_report: { 
    label: 'Full Logistics Report', 
    description: 'Comprehensive report covering all areas',
    icon: FileText 
  },
};

export function GenerateReportTab({ workspaceId }: GenerateReportTabProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('daily_summary');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: reports, isLoading } = useLogisticsReports(workspaceId);
  const generateReport = useGenerateReport(workspaceId);
  const deleteReport = useDeleteReport(workspaceId);
  const stats = useLogisticsStats(workspaceId);

  const handleGenerateReport = () => {
    const typeInfo = reportTypeConfig[selectedType];
    
    // Build report content based on type
    const content: Record<string, unknown> = {
      generated_at: new Date().toISOString(),
      report_type: selectedType,
      date_range: dateRange,
    };

    // Add stats based on report type
    switch (selectedType) {
      case 'equipment_status':
        content.equipment = stats.equipment;
        break;
      case 'shipment_status':
        content.shipments = stats.shipments;
        break;
      case 'transport_summary':
        content.transports = stats.transports;
        break;
      case 'venue_readiness':
        content.venues = stats.venues;
        break;
      case 'daily_summary':
      case 'full_report':
        content.shipments = stats.shipments;
        content.equipment = stats.equipment;
        content.transports = stats.transports;
        content.venues = stats.venues;
        content.issues = stats.issues;
        break;
    }

    generateReport.mutate({
      report_type: selectedType,
      title: `${typeInfo.label} - ${format(new Date(), 'MMM d, yyyy')}`,
      content,
      date_range_start: dateRange.start,
      date_range_end: dateRange.end,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Generate Report Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value: ReportType) => setSelectedType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reportTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {reportTypeConfig[selectedType].description}
              </p>
            </div>

            <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {generateReport.isPending ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Shipments</span>
              </div>
              <p className="text-2xl font-bold">{stats.shipments.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.shipments.delivered} delivered
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Equipment</span>
              </div>
              <p className="text-2xl font-bold">{stats.equipment.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.equipment.available} available
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Transports</span>
              </div>
              <p className="text-2xl font-bold">{stats.transports.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.transports.scheduled} scheduled
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Venues</span>
              </div>
              <p className="text-2xl font-bold">{stats.venues.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.venues.ready} ready
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Issues</span>
              </div>
              <p className="text-2xl font-bold">{stats.issues.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.issues.open} open
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {!reports?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const typeInfo = reportTypeConfig[report.report_type as ReportType] || reportTypeConfig.daily_summary;
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{typeInfo.label}</Badge>
                          <span>•</span>
                          <span>Generated {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</span>
                          {report.generated_by_name && (
                            <>
                              <span>•</span>
                              <span>by {report.generated_by_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Export as formatted JSON file
                          const content = JSON.stringify(report.content, null, 2);
                          const blob = new Blob([content], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${report.title.replace(/\s+/g, '-')}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Export as CSV file
                          const reportData = report.content as Record<string, unknown>;
                          let csvContent = `Report: ${report.title}\n`;
                          csvContent += `Generated: ${format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}\n\n`;
                          
                          // Add stats sections
                          Object.entries(reportData).forEach(([key, value]) => {
                            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                              csvContent += `\n${key.toUpperCase()}\n`;
                              Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
                                csvContent += `${k},${v}\n`;
                              });
                            }
                          });
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${report.title.replace(/\s+/g, '-')}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReport.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
