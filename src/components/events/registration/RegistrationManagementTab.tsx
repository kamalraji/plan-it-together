/**
 * RegistrationManagementTab
 * Industrial-standard registration management with filters, bulk actions, and export
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useUrlState } from '@/hooks/useUrlState';
import { 
  useEventRegistrations, 
  useEventRegistrationStats,
  useUpdateRegistrationStatus,
  useBulkUpdateRegistrations,
  exportRegistrationsToCSV,
  type RegistrationStatus,
  type Registration,
} from '@/hooks/useEventRegistrations';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { RegistrationMobileCard } from './RegistrationMobileCard';
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';

interface RegistrationManagementTabProps {
  eventId: string;
  canManage: boolean;
}

const STATUS_CONFIG: Record<RegistrationStatus | 'CHECKED_IN', { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Users },
  CHECKED_IN: { label: 'Checked In', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: UserCheck },
};

export const RegistrationManagementTab: React.FC<RegistrationManagementTabProps> = ({
  eventId,
  canManage,
}) => {
  const { toast } = useToast();
  const { message: announcement, announce } = useLiveAnnouncement();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // URL state for filters
  const [statusFilter, setStatusFilter] = useUrlState<string>('status', 'all');
  const [searchQuery, setSearchQuery] = useUrlState<string>('search', '');
  const [page, setPage] = useUrlState<number>('page', 1);

  // Queries
  const { data: registrationData, isLoading, refetch } = useEventRegistrations(eventId, {
    status: statusFilter as RegistrationStatus | 'all',
    search: searchQuery,
    page,
    limit: 20,
  });

  const { data: stats } = useEventRegistrationStats(eventId);

  // Mutations
  const updateStatus = useUpdateRegistrationStatus(eventId);
  const bulkUpdate = useBulkUpdateRegistrations(eventId);

  const registrations = registrationData?.registrations || [];
  const totalPages = registrationData?.totalPages || 1;
  const total = registrationData?.total || 0;

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registrations.map(r => r.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkAction = async (status: RegistrationStatus) => {
    if (selectedIds.size === 0) return;
    
    await bulkUpdate.mutateAsync({
      registrationIds: Array.from(selectedIds),
      status,
    });
    clearSelection();
  };

  // Export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = await exportRegistrationsToCSV(eventId, {
        status: statusFilter as RegistrationStatus | 'all',
        search: searchQuery,
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${eventId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export complete', description: `${total} registrations exported` });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Search with debounce effect handled by URL state
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Accessibility: Live region for status announcements */}
      <LiveRegion message={announcement} priority="polite" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats?.total ?? 0} />
        <StatCard label="Confirmed" value={stats?.confirmed ?? 0} color="text-green-600" />
        <StatCard label="Pending" value={stats?.pending ?? 0} color="text-yellow-600" />
        <StatCard label="Waitlisted" value={stats?.waitlisted ?? 0} color="text-blue-600" />
        <StatCard label="Checked In" value={stats?.checkedIn ?? 0} color="text-purple-600" />
        <StatCard 
          label="Revenue" 
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`} 
          color="text-primary"
        />
      </div>

      {/* Filters and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              aria-label="Search registrations"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Refresh registrations"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isExporting || total === 0}
            className="min-h-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && canManage && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('CONFIRMED')}
              disabled={bulkUpdate.isPending}
              className="min-h-[44px]"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('CANCELLED')}
              disabled={bulkUpdate.isPending}
              className="min-h-[44px]"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={clearSelection}
            className="ml-auto min-h-[44px]"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Registration List */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_120px_100px_120px_80px] gap-4 p-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {canManage && (
            <div className="flex items-center">
              <Checkbox 
                checked={selectedIds.size === registrations.length && registrations.length > 0}
                onCheckedChange={toggleAll}
                aria-label="Select all registrations"
              />
            </div>
          )}
          <div>Attendee</div>
          <div>Ticket</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && registrations.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No registrations found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Registrations will appear here when attendees sign up'}
            </p>
          </div>
        )}

        {/* Registration Rows - Desktop: Table, Mobile: Cards */}
        {!isLoading && registrations.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden">
              {registrations.map((registration) => (
                <RegistrationMobileCard
                  key={registration.id}
                  registration={registration}
                  isSelected={selectedIds.has(registration.id)}
                  onSelect={() => toggleSelection(registration.id)}
                  onStatusChange={(status) => {
                    updateStatus.mutate({ registrationId: registration.id, status });
                    announce(`Status updated for ${registration.user?.fullName || 'registration'}`);
                  }}
                  canManage={canManage}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block divide-y divide-border">
              {registrations.map((registration) => (
                <RegistrationRow
                  key={registration.id}
                  registration={registration}
                  isSelected={selectedIds.has(registration.id)}
                  onSelect={() => toggleSelection(registration.id)}
                  onStatusChange={(status) => {
                    updateStatus.mutate({ registrationId: registration.id, status });
                    announce(`Status updated for ${registration.user?.fullName || 'registration'}`);
                  }}
                  canManage={canManage}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ 
  label, 
  value, 
  color = 'text-foreground' 
}) => (
  <div className="p-4 bg-card border border-border rounded-lg">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className={`text-xl font-semibold ${color} mt-1`}>{value}</p>
  </div>
);

// Registration Row Component
const RegistrationRow: React.FC<{
  registration: Registration;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (status: RegistrationStatus) => void;
  canManage: boolean;
  isUpdating: boolean;
}> = ({ registration, isSelected, onSelect, onStatusChange, canManage, isUpdating }) => {
  const statusConfig = STATUS_CONFIG[registration.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[40px_1fr_120px_100px_120px_80px] gap-3 sm:gap-4 p-4 hover:bg-muted/30 transition-colors">
      {/* Checkbox - Desktop */}
      {canManage && (
        <div className="hidden sm:flex items-center">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select ${registration.user?.fullName || 'registration'}`}
          />
        </div>
      )}

      {/* Attendee Info */}
      <div className="flex items-center gap-3">
        {canManage && (
          <div className="sm:hidden">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Select ${registration.user?.fullName || 'registration'}`}
            />
          </div>
        )}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={registration.user?.avatarUrl || undefined} />
          <AvatarFallback>
            {registration.user?.fullName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {registration.user?.fullName || 'Unknown User'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {registration.user?.email || 'No email'}
          </p>
        </div>
      </div>

      {/* Ticket */}
      <div className="flex items-center">
        <span className="text-sm text-foreground">
          {registration.ticketTierName || 'General'}
          {registration.quantity > 1 && ` × ${registration.quantity}`}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-foreground">
          {registration.totalAmount > 0 
            ? `$${registration.totalAmount.toFixed(2)}`
            : 'Free'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <Badge className={`${statusConfig.color} border-0 gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end">
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                disabled={isUpdating}
                className="min-h-[44px] min-w-[44px]"
                aria-label="Registration actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {registration.status !== 'CONFIRMED' && (
                <DropdownMenuItem onClick={() => onStatusChange('CONFIRMED')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Approve
                </DropdownMenuItem>
              )}
              {registration.status === 'WAITLISTED' && (
                <DropdownMenuItem onClick={() => onStatusChange('CONFIRMED')}>
                  <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                  Move to Confirmed
                </DropdownMenuItem>
              )}
              {registration.status !== 'CANCELLED' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onStatusChange('CANCELLED')}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <span className="text-xs text-muted-foreground ml-2 hidden lg:block">
          {formatDistanceToNow(new Date(registration.registeredAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export default RegistrationManagementTab;
