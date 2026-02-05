import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
  CheckSquare,
  Clock,
  Filter,
  Download,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface FormSubmission {
  id: string;
  formId: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  responses: Record<string, any>;
  status: 'pending' | 'reviewed' | 'processed';
  createdAt: string;
}

interface SubmissionsListProps {
  formTitle: string;
  submissions: FormSubmission[];
  fieldLabels: Record<string, string>;
  onView?: (submission: FormSubmission) => void;
  onDelete?: (submissionId: string) => void;
  onStatusChange?: (submissionId: string, status: FormSubmission['status']) => void;
  onExport?: () => void;
}

export function SubmissionsList({
  formTitle,
  submissions,
  fieldLabels,
  onView,
  onDelete,
  onStatusChange,
  onExport,
}: SubmissionsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormSubmission['status'] | 'all'>('all');

  const filteredSubmissions = submissions.filter(sub => {
    // Status filter
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = sub.submittedBy?.name?.toLowerCase().includes(query);
      const matchesEmail = sub.submittedBy?.email?.toLowerCase().includes(query);
      const matchesResponses = Object.values(sub.responses).some(v =>
        String(v).toLowerCase().includes(query)
      );
      return matchesName || matchesEmail || matchesResponses;
    }

    return true;
  });

  const getStatusBadge = (status: FormSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="bg-info/20 text-info border-info/30">Reviewed</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-success/20 text-success border-success/30">Processed</Badge>;
    }
  };

  // Get first 3 fields for table display
  const displayFields = Object.keys(fieldLabels).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{formTitle} Submissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {submissions.length} total submissions
            </p>
          </div>
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('reviewed')}>
                Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('processed')}>
                Processed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted By</TableHead>
                {displayFields.map(fieldId => (
                  <TableHead key={fieldId}>{fieldLabels[fieldId]}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayFields.length + 4} className="text-center py-8">
                    <p className="text-muted-foreground">No submissions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.submittedBy?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{sub.submittedBy?.email}</p>
                      </div>
                    </TableCell>
                    {displayFields.map(fieldId => (
                      <TableCell key={fieldId}>
                        <span className="truncate max-w-[150px] block">
                          {formatValue(sub.responses[fieldId])}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(sub)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onStatusChange && (
                            <>
                              <DropdownMenuItem onClick={() => onStatusChange(sub.id, 'reviewed')}>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark as Reviewed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onStatusChange(sub.id, 'processed')}>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark as Processed
                              </DropdownMenuItem>
                            </>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(sub.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
