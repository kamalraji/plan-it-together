import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardExportButtonProps {
  workspaceId: string;
  dashboardType: string;
  dataFetcher?: () => Promise<Record<string, unknown>[]>;
}

export function DashboardExportButton({ 
  workspaceId, 
  dashboardType,
  dataFetcher 
}: DashboardExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const fetchDashboardData = async (): Promise<Record<string, unknown>[]> => {
    if (dataFetcher) {
      return dataFetcher();
    }

    // Default data fetchers based on dashboard type
    switch (dashboardType) {
      case 'logistics': {
        const { data } = await supabase
          .from('workspace_logistics')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
      case 'finance': {
        const { data } = await supabase
          .from('workspace_expenses')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
      case 'catering': {
        const { data } = await supabase
          .from('catering_menu_items')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
      case 'volunteers': {
        const { data } = await supabase
          .from('volunteer_shifts')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
      case 'media': {
        const { data } = await supabase
          .from('media_crew')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
      case 'sponsorship': {
        const { data } = await supabase
          .from('workspace_tasks')
          .select('*')
          .eq('workspace_id', workspaceId)
          .ilike('title', '%sponsor%');
        return (data || []) as Record<string, unknown>[];
      }
      default: {
        const { data } = await supabase
          .from('workspace_tasks')
          .select('*')
          .eq('workspace_id', workspaceId);
        return (data || []) as Record<string, unknown>[];
      }
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = await fetchDashboardData();
      
      if (data.length === 0) {
        toast.info('No data to export');
        return;
      }

      // Get headers from first item
      const headers = Object.keys(data[0]);
      
      // Build CSV content
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle special cases
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return String(value);
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dashboardType}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export completed');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const data = await fetchDashboardData();
      
      if (data.length === 0) {
        toast.info('No data to export');
        return;
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dashboardType}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export completed');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
