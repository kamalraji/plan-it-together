import { useState, useMemo } from 'react';
import { WorkspaceWithStats } from '@/hooks/useAllWorkspacesData';
import { WorkspaceType, WorkspaceStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Archive, 
  Trash2, 
  Users, 
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Building2,
  Layers,
  UsersRound,
  CircleDot
} from 'lucide-react';
import { format } from 'date-fns';

interface AllWorkspacesTableProps {
  workspaces: WorkspaceWithStats[];
  onViewWorkspace: (workspaceId: string) => void;
  onArchiveWorkspace: (workspaceId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

type SortField = 'name' | 'workspaceType' | 'status' | 'memberCount' | 'taskCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | WorkspaceType;
type FilterStatus = 'all' | 'active' | 'archived';

const typeConfig: Record<WorkspaceType, { label: string; icon: React.ReactNode; color: string }> = {
  [WorkspaceType.ROOT]: { label: 'Root', icon: <Layers className="w-3 h-3" />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  [WorkspaceType.DEPARTMENT]: { label: 'Dept', icon: <Building2 className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  [WorkspaceType.COMMITTEE]: { label: 'Comm', icon: <UsersRound className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  [WorkspaceType.TEAM]: { label: 'Team', icon: <Users className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

export function AllWorkspacesTable({
  workspaces,
  onViewWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  selectedIds,
  onSelectionChange,
}: AllWorkspacesTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('workspaceType');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredAndSorted = useMemo(() => {
    let result = [...workspaces];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(ws => ws.name.toLowerCase().includes(searchLower));
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(ws => ws.workspaceType === filterType);
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter(ws => ws.status === WorkspaceStatus.ACTIVE);
    } else if (filterStatus === 'archived') {
      result = result.filter(ws => ws.status === WorkspaceStatus.ARCHIVED);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'workspaceType':
          const typeOrder = { [WorkspaceType.ROOT]: 0, [WorkspaceType.DEPARTMENT]: 1, [WorkspaceType.COMMITTEE]: 2, [WorkspaceType.TEAM]: 3 };
          comparison = typeOrder[a.workspaceType] - typeOrder[b.workspaceType];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'memberCount':
          comparison = a.memberCount - b.memberCount;
          break;
        case 'taskCount':
          comparison = a.taskCount - b.taskCount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [workspaces, search, sortField, sortDirection, filterType, filterStatus]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredAndSorted.map(ws => ws.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  const allSelected = filteredAndSorted.length > 0 && selectedIds.length === filteredAndSorted.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredAndSorted.length;

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="w-4 h-4" />
                {filterType === 'all' ? 'All Types' : typeConfig[filterType].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(typeConfig).map(([type, config]) => (
                <DropdownMenuItem key={type} onClick={() => setFilterType(type as WorkspaceType)}>
                  <span className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <CircleDot className="w-4 h-4" />
                {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>All Status</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('archived')}>Archived</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('name')}
                >
                  Name
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('workspaceType')}
                >
                  Type
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('memberCount')}
                >
                  <Users className="w-3.5 h-3.5" />
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('taskCount')}
                >
                  Tasks
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No workspaces found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((ws) => {
                const typeInfo = typeConfig[ws.workspaceType];
                const isSelected = selectedIds.includes(ws.id);
                const taskProgress = ws.taskCount > 0 
                  ? Math.round((ws.completedTaskCount / ws.taskCount) * 100) 
                  : 0;

                return (
                  <TableRow 
                    key={ws.id} 
                    className={isSelected ? 'bg-primary/5' : undefined}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(ws.id, !!checked)}
                        aria-label={`Select ${ws.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <button 
                        onClick={() => onViewWorkspace(ws.id)}
                        className="hover:text-primary hover:underline text-left"
                      >
                        {ws.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`gap-1 ${typeInfo.color}`}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={ws.status === WorkspaceStatus.ACTIVE ? 'default' : 'secondary'}
                        className={ws.status === WorkspaceStatus.ACTIVE 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-muted text-muted-foreground dark:bg-foreground/80 dark:text-muted-foreground'
                        }
                      >
                        {ws.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {ws.memberCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {ws.completedTaskCount}/{ws.taskCount}
                        </span>
                        {ws.taskCount > 0 && (
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${taskProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(ws.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewWorkspace(ws.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onArchiveWorkspace(ws.id)}
                            disabled={ws.workspaceType === WorkspaceType.ROOT}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteWorkspace(ws.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={ws.workspaceType === WorkspaceType.ROOT}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection info */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          {selectedIds.length} workspace{selectedIds.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
