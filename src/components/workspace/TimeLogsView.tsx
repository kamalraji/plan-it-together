import { useState } from 'react';
import { useTimeTracking, useTeamTimeEntries } from '@/hooks/useTimeTracking';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Clock, Trash2, Pencil, Check, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeLogsViewProps {
  workspaceId: string;
  userId?: string;
  isManager?: boolean;
}

export function TimeLogsView({ workspaceId, userId, isManager = false }: TimeLogsViewProps) {
  const personalTime = useTimeTracking(workspaceId, userId);
  const teamTime = useTeamTimeEntries(workspaceId);
  
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const entries = isManager ? teamTime.entries : personalTime.entries;
  const isLoading = isManager ? teamTime.isLoading : personalTime.isLoading;

  const filteredEntries = entries.filter((e: any) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const groupedByDate = filteredEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditHours(entry.hours.toString());
  };

  const handleSaveEdit = (entry: any) => {
    const hours = parseFloat(editHours);
    if (!isNaN(hours) && hours > 0) {
      personalTime.updateEntry({ id: entry.id, hours });
    }
    setEditingId(null);
    setEditHours('');
  };

  const handleDelete = () => {
    if (deleteId) {
      personalTime.deleteEntry(deleteId);
      setDeleteId(null);
    }
  };

  const totalHours = filteredEntries.reduce((sum: number, e: any) => sum + Number(e.hours), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Time Logs</h3>
            <p className="text-sm text-muted-foreground">
              {filteredEntries.length} entries • {totalHours.toFixed(1)} hours total
            </p>
          </div>
        </div>

        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries grouped by date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No time entries yet</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateEntries]) => {
            const dayTotal = (dateEntries as any[]).reduce((sum, e) => sum + Number(e.hours), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {formatDateHeader(date)}
                  </h4>
                  <span className="text-sm font-medium">{dayTotal.toFixed(1)}h</span>
                </div>
                <div className="space-y-2">
                  {(dateEntries as any[]).map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {editingId === entry.id ? (
                                <Input
                                  type="number"
                                  step="0.25"
                                  value={editHours}
                                  onChange={(e) => setEditHours(e.target.value)}
                                  className="w-20 h-7 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-semibold">{Number(entry.hours).toFixed(2)}h</span>
                              )}
                              <Badge variant="secondary" className={cn('text-xs', getStatusColor(entry.status))}>
                                {entry.status}
                              </Badge>
                              {isManager && (entry as any).user_profiles?.full_name && (
                                <Badge variant="outline" className="text-xs">
                                  {(entry as any).user_profiles.full_name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.description || 'No description'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {editingId === entry.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleSaveEdit(entry)}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {entry.status === 'draft' && !isManager && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEdit(entry)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteId(entry.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {isManager && entry.status === 'submitted' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => teamTime.approveEntry(entry.id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => teamTime.rejectEntry(entry.id)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete time entry"
        description="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
