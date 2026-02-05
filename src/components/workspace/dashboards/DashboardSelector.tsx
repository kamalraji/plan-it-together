import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  ChevronDown,
  Plus,
  Star,
  Trash2,
  Copy,
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  isDefault?: boolean;
  widgetCount: number;
}

interface DashboardSelectorProps {
  dashboards: Dashboard[];
  activeDashboardId: string;
  onSelect: (dashboardId: string) => void;
  onCreateNew: () => void;
  onDelete?: (dashboardId: string) => void;
  onDuplicate?: (dashboardId: string) => void;
  onSetDefault?: (dashboardId: string) => void;
}

export function DashboardSelector({
  dashboards,
  activeDashboardId,
  onSelect,
  onCreateNew,
  onDelete,
  onDuplicate,
  onSetDefault,
}: DashboardSelectorProps) {
  const activeDashboard = dashboards.find(d => d.id === activeDashboardId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="truncate">{activeDashboard?.name || 'Select Dashboard'}</span>
            {activeDashboard?.isDefault && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Default
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {dashboards.map((dashboard) => (
          <DropdownMenuItem
            key={dashboard.id}
            onClick={() => onSelect(dashboard.id)}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className={dashboard.id === activeDashboardId ? 'font-medium' : ''}>
                {dashboard.name}
              </span>
              {dashboard.isDefault && (
                <Star className="h-3 w-3 text-warning fill-yellow-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {dashboard.widgetCount} widgets
            </span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Dashboard
        </DropdownMenuItem>
        
        {activeDashboard && (
          <>
            <DropdownMenuSeparator />
            
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(activeDashboardId)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Current
              </DropdownMenuItem>
            )}
            
            {onSetDefault && !activeDashboard.isDefault && (
              <DropdownMenuItem onClick={() => onSetDefault(activeDashboardId)}>
                <Star className="h-4 w-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            
            {onDelete && dashboards.length > 1 && (
              <DropdownMenuItem
                onClick={() => onDelete(activeDashboardId)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Dashboard
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
