import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Workspace } from '@/types';
import { useExportList } from '@/hooks/useExportList';
import { type ExportField } from '@/lib/export-utils';

interface ExportListTabProps {
  workspace: Workspace;
}

const exportFormats = [
  { id: 'csv', name: 'CSV', icon: FileSpreadsheet, description: 'Excel compatible spreadsheet' },
  { id: 'xlsx', name: 'Excel', icon: FileSpreadsheet, description: 'Native Excel format' },
  { id: 'pdf', name: 'PDF', icon: FileText, description: 'Printable document' },
  { id: 'json', name: 'JSON', icon: FileJson, description: 'Developer-friendly format' },
];

const dataFields: { id: ExportField; label: string; required: boolean }[] = [
  { id: 'name', label: 'Full Name', required: true },
  { id: 'email', label: 'Email Address', required: true },
  { id: 'phone', label: 'Phone Number', required: false },
  { id: 'ticketType', label: 'Ticket Type', required: false },
  { id: 'registrationDate', label: 'Registration Date', required: false },
  { id: 'status', label: 'Status', required: false },
  { id: 'checkInTime', label: 'Check-in Time', required: false },
  { id: 'customFields', label: 'Custom Fields', required: false },
];

export function ExportListTab({ workspace }: ExportListTabProps) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState<ExportField[]>(['name', 'email', 'ticketType', 'status']);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');

  const {
    stats,
    ticketTiers,
    exportHistory,
    isLoadingStats,
    isLoadingHistory,
    isExporting,
    exportProgress,
    exportData,
  } = useExportList({ 
    eventId: workspace.eventId || '', 
    workspaceId: workspace.id 
  });

  const toggleField = (fieldId: ExportField) => {
    const field = dataFields.find(f => f.id === fieldId);
    if (field?.required) return;
    
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    exportData(
      selectedFormat,
      selectedFields,
      statusFilter,
      ticketFilter,
      workspace.name || 'event'
    );
  };

  const getFormatIcon = (formatId: string) => {
    const fmt = exportFormats.find(f => f.id === formatId.toLowerCase());
    return fmt?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6 text-purple-500" />
          Export Attendee List
        </h2>
        <p className="text-muted-foreground mt-1">Download registration data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose the file format for your export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exportFormats.map(fmt => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedFormat === fmt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${selectedFormat === fmt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="font-medium">{fmt.name}</p>
                      <p className="text-xs text-muted-foreground">{fmt.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Data Fields</CardTitle>
              <CardDescription>Select which fields to include in the export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataFields.map(field => (
                  <div
                    key={field.id}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedFields.includes(field.id) ? 'bg-primary/5 border-primary/30' : 'border-border'
                    }`}
                  >
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      disabled={field.required}
                    />
                    <Label htmlFor={field.id} className="flex-1 cursor-pointer text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <CardDescription>Filter which records to include</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed Only</SelectItem>
                      <SelectItem value="checked_in">Checked In Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="cancelled">Cancelled Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select value={ticketFilter} onValueChange={setTicketFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      {ticketTiers.map(tier => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              {isExporting ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              ) : (
                <Button 
                  onClick={handleExport} 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  size="lg"
                  disabled={!workspace.eventId || stats.total === 0}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export {selectedFields.length} Fields as {exportFormats.find(f => f.id === selectedFormat)?.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStats ? (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Total Records</span>
                    </div>
                    <Badge>{stats.total.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Confirmed</span>
                    </div>
                    <span className="text-sm">{stats.confirmed.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Pending</span>
                    </div>
                    <span className="text-sm">{stats.pending.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Cancelled</span>
                    </div>
                    <span className="text-sm">{stats.cancelled.toLocaleString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingHistory ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : exportHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No exports yet
                </p>
              ) : (
                exportHistory.map(exp => {
                  const Icon = getFormatIcon(exp.format);
                  return (
                    <div key={exp.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{exp.filename}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{exp.record_count.toLocaleString()} records</span>
                            <span>·</span>
                            <span>{format(new Date(exp.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
