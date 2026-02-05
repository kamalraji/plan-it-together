import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { useWorkspaceBudget, useBudgetRequests } from '@/hooks/useWorkspaceBudget';
import { Download, Loader2, FileJson, FileSpreadsheet, Database } from 'lucide-react';
import { format } from 'date-fns';

interface ExportDataTabProps {
  workspace: Workspace;
}

type DataType = 'expenses' | 'budget' | 'requests' | 'all';
type ExportFormat = 'csv' | 'json';

export function ExportDataTab({ workspace }: ExportDataTabProps) {
  const { expenses, isLoading: expensesLoading } = useWorkspaceExpenses(workspace.id);
  const { budget, categories, isLoading: budgetLoading } = useWorkspaceBudget(workspace.id);
  const { requests, isLoading: requestsLoading } = useBudgetRequests(workspace.id, 'requester');

  const [dataType, setDataType] = useState<DataType>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const isLoading = expensesLoading || budgetLoading || requestsLoading;

  const filterByDate = <T extends { created_at?: string; submitted_at?: string }>(items: T[]) => {
    return items.filter(item => {
      const itemDate = new Date(item.created_at || item.submitted_at || '');
      if (dateFrom && itemDate < new Date(dateFrom)) return false;
      if (dateTo && itemDate > new Date(dateTo)) return false;
      return true;
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toCSV = (data: any[], name: string) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    return [
      `--- ${name} ---`,
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      const filename = `${workspace.name.replace(/\s+/g, '-')}-finance-data-${timestamp}`;

      let exportData: any = {};

      if (dataType === 'expenses' || dataType === 'all') {
        const filteredExpenses = filterByDate(expenses);
        exportData.expenses = filteredExpenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          category: e.category,
          status: e.status,
          submitted_at: e.submitted_at,
          notes: e.notes,
          ...(includeMetadata && {
            submitted_by: e.submitted_by,
            approved_by: e.approved_by,
            approved_at: e.approved_at,
            created_at: e.created_at,
            updated_at: e.updated_at,
          }),
        }));
      }

      if (dataType === 'budget' || dataType === 'all') {
        exportData.budget = budget ? {
          id: budget.id,
          allocated: budget.allocated,
          used: budget.used,
          remaining: budget.allocated - budget.used,
          currency: budget.currency,
          fiscal_year: budget.fiscal_year,
          ...(includeMetadata && {
            created_at: budget.created_at,
            updated_at: budget.updated_at,
          }),
        } : null;
        
        exportData.categories = categories.map(c => ({
          id: c.id,
          name: c.name,
          allocated: c.allocated,
          used: c.used,
          remaining: c.allocated - c.used,
          ...(includeMetadata && {
            created_at: c.created_at,
          }),
        }));
      }

      if (dataType === 'requests' || dataType === 'all') {
        const filteredRequests = filterByDate(requests);
        exportData.budgetRequests = filteredRequests.map(r => ({
          id: r.id,
          requested_amount: r.requested_amount,
          reason: r.reason,
          status: r.status,
          requesting_workspace: r.requesting_workspace?.name,
          target_workspace: r.target_workspace?.name,
          review_notes: r.review_notes,
          ...(includeMetadata && {
            requested_by: r.requested_by,
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at,
            created_at: r.created_at,
          }),
        }));
      }

      if (exportFormat === 'json') {
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
      } else {
        let csvContent = '';
        
        if (exportData.expenses?.length > 0) {
          csvContent += toCSV(exportData.expenses, 'Expenses') + '\n\n';
        }
        
        if (exportData.budget) {
          csvContent += toCSV([exportData.budget], 'Budget Summary') + '\n\n';
        }
        
        if (exportData.categories?.length > 0) {
          csvContent += toCSV(exportData.categories, 'Budget Categories') + '\n\n';
        }
        
        if (exportData.budgetRequests?.length > 0) {
          csvContent += toCSV(exportData.budgetRequests, 'Budget Requests') + '\n\n';
        }

        downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Financial Data
          </CardTitle>
          <CardDescription>
            Download your finance data in CSV or JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Type Selection */}
          <div className="space-y-2">
            <Label>Data to Export</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Financial Data</SelectItem>
                <SelectItem value="expenses">Expenses Only</SelectItem>
                <SelectItem value="budget">Budget & Categories</SelectItem>
                <SelectItem value="requests">Budget Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-4">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                onClick={() => setExportFormat('json')}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date (optional)</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date (optional)</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Include Metadata */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
            />
            <Label htmlFor="include-metadata" className="cursor-pointer">
              Include metadata (IDs, timestamps, user references)
            </Label>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-info" />
            Available Data
          </CardTitle>
          <CardDescription>Summary of data that can be exported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{expenses.length}</div>
              <p className="text-xs text-muted-foreground">Expense Records</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{budget ? 1 : 0}</div>
              <p className="text-xs text-muted-foreground">Budget Record</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Budget Categories</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">Budget Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
