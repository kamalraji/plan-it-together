import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ListOrdered, 
  Search,
  UserPlus,
  Mail,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Ticket,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Workspace } from '@/types';
import { useWaitlist, WaitlistEntry } from '@/hooks/useWaitlist';

interface ViewWaitlistTabProps {
  workspace: Workspace;
}

export function ViewWaitlistTab({ workspace }: ViewWaitlistTabProps) {
  const {
    waitlist,
    stats,
    ticketAvailability,
    ticketTiers,
    isLoading,
    isProcessing,
    moveUp,
    moveDown,
    promoteEntry,
    removeEntry,
    sendInvites,
    bulkPromote,
    refetch,
  } = useWaitlist({ eventId: workspace.eventId || '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const filteredWaitlist = waitlist.filter(entry => {
    const matchesSearch = entry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTicket = ticketFilter === 'all' || entry.ticketTierId === ticketFilter;
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    return matchesSearch && matchesTicket && matchesPriority;
  });

  const handlePromote = async (entry: WaitlistEntry) => {
    await promoteEntry(entry.id);
    setSelectedEntries(prev => prev.filter(id => id !== entry.id));
  };

  const handleRemove = async (entry: WaitlistEntry) => {
    await removeEntry(entry.id);
    setSelectedEntries(prev => prev.filter(id => id !== entry.id));
  };

  const handleMoveUp = async (entry: WaitlistEntry) => {
    await moveUp(entry.id);
  };

  const handleMoveDown = async (entry: WaitlistEntry) => {
    await moveDown(entry.id);
  };

  const handleBulkPromote = async () => {
    await bulkPromote(selectedEntries);
    setSelectedEntries([]);
  };

  const handleSendInvites = async () => {
    await sendInvites();
  };

  const getPriorityBadge = (priority: WaitlistEntry['priority']) => {
    switch (priority) {
      case 'vip':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">VIP</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Priority</Badge>;
      default:
        return null;
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEntries.length === filteredWaitlist.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredWaitlist.map(e => e.id));
    }
  };

  const totalAvailableSpots = ticketAvailability.reduce((sum, t) => sum + t.available, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-cyan-500" />
            Waitlist Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            {stats.totalWaiting} in queue · Manage and promote waitlisted attendees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => refetch()}
            disabled={isProcessing}
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-cyan-600">{stats.totalWaiting}</p>
            <p className="text-sm text-muted-foreground">Total Waitlisted</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{totalAvailableSpots}</p>
            <p className="text-sm text-muted-foreground">Spots Available</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.priorityCount}</p>
            <p className="text-sm text-muted-foreground">Priority Entries</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.avgWaitDays}</p>
            <p className="text-sm text-muted-foreground">Avg Days Waiting</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Waitlist */}
        <div className="lg:col-span-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={ticketFilter} onValueChange={setTicketFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    {ticketTiers.map(tier => (
                      <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedEntries.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                  <span className="text-sm font-medium">{selectedEntries.length} selected</span>
                  <Button 
                    size="sm" 
                    onClick={handleBulkPromote} 
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Promote Selected
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email Selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEntries([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Select All */}
              <div className="flex items-center gap-2 mb-3 px-3">
                <Checkbox
                  checked={selectedEntries.length === filteredWaitlist.length && filteredWaitlist.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>

              {filteredWaitlist.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Waitlist is empty</p>
                  <p className="text-sm">No entries match your filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWaitlist.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        selectedEntries.includes(entry.id) ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                        />
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          #{entry.position}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm bg-muted">
                            {entry.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{entry.fullName}</p>
                            {getPriorityBadge(entry.priority)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{entry.email}</span>
                            <span>·</span>
                            <Badge variant="outline" className="text-[10px]">
                              {entry.ticketTierName || 'No tier'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Joined {formatDistanceToNow(entry.createdAt, { addSuffix: true })}</span>
                            {entry.notes && (
                              <>
                                <span>·</span>
                                <span className="italic">{entry.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => handleMoveUp(entry)} 
                          disabled={index === 0 || isProcessing}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => handleMoveDown(entry)} 
                          disabled={index === filteredWaitlist.length - 1 || isProcessing}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" 
                          onClick={() => handlePromote(entry)}
                          disabled={isProcessing}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                          onClick={() => handleRemove(entry)}
                          disabled={isProcessing}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Availability */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketAvailability.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No ticket tiers configured</p>
              ) : (
                ticketAvailability.map(ticket => (
                  <div key={ticket.tierId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm">{ticket.tierName}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={ticket.available > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>
                        {ticket.available} spots
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleSendInvites}
                disabled={isProcessing || totalAvailableSpots === 0 || stats.totalWaiting === 0}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Invites to Available
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => waitlist[0] && handlePromote(waitlist[0])}
                disabled={isProcessing || waitlist.length === 0}
              >
                <UserPlus className="w-4 h-4" />
                Promote Top Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
