import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, CheckCircle2 } from 'lucide-react';
import { AttendeeForCard } from '@/hooks/useIDCardGeneration';

interface AttendeeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendees: AttendeeForCard[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  ticketTypes: string[];
}

export function AttendeeSelectionModal({
  open,
  onOpenChange,
  attendees,
  selectedIds,
  onSelectionChange,
  ticketTypes,
}: AttendeeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [localSelection, setLocalSelection] = useState<Set<string>>(new Set(selectedIds));

  // Filter attendees based on search and filters
  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          attendee.full_name.toLowerCase().includes(query) ||
          attendee.email.toLowerCase().includes(query) ||
          (attendee.organization?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'checked_in' && !attendee.checked_in) return false;
        if (statusFilter === 'not_checked_in' && attendee.checked_in) return false;
        if (statusFilter === 'confirmed' && attendee.status !== 'confirmed') return false;
      }

      // Ticket filter
      if (ticketFilter !== 'all' && attendee.ticket_type !== ticketFilter) {
        return false;
      }

      return true;
    });
  }, [attendees, searchQuery, statusFilter, ticketFilter]);

  const handleToggle = (id: string) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setLocalSelection(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredAttendees.map(a => a.id));
    setLocalSelection(allIds);
  };

  const handleDeselectAll = () => {
    setLocalSelection(new Set());
  };

  const handleConfirm = () => {
    onSelectionChange(Array.from(localSelection));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Attendees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="not_checked_in">Not Checked In</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ticket Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                {ticketTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredAttendees.length} attendees found • {localSelection.size} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All ({filteredAttendees.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Attendee List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredAttendees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendees found matching your criteria
                </div>
              ) : (
                filteredAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      localSelection.has(attendee.id)
                        ? 'bg-primary/5 border-primary/30'
                        : 'hover:bg-muted/50 border-transparent'
                    }`}
                    onClick={() => handleToggle(attendee.id)}
                  >
                    <Checkbox
                      checked={localSelection.has(attendee.id)}
                      onCheckedChange={() => handleToggle(attendee.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{attendee.full_name}</span>
                        {attendee.checked_in && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {attendee.email}
                        {attendee.organization && ` • ${attendee.organization}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {attendee.ticket_type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Selection ({localSelection.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
