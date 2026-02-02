import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Search, 
  Mail, 
  Phone, 
  Clock,
  Plus,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  useSpeakerCommunications,
  useSpeakerLiaisonSpeakers,
  useUpdateCommunicationStatus 
} from '@/hooks/useSpeakerLiaisonData';
import { LogCommunicationDialog } from '../../../speaker-liaison/LogCommunicationDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CommunicationLogTabProps {
  workspaceId: string;
}

export function CommunicationLogTab({ workspaceId }: CommunicationLogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showLogDialog, setShowLogDialog] = useState(false);

  const { data: communications = [], isLoading } = useSpeakerCommunications(workspaceId);
  const { data: speakers = [] } = useSpeakerLiaisonSpeakers(workspaceId);
  const updateStatus = useUpdateCommunicationStatus(workspaceId);

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = 
      comm.speaker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="h-4 w-4" />;
    if (type === 'call') return <Phone className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      sent: { color: 'bg-blue-500/10 text-blue-600', label: 'Sent' },
      read: { color: 'bg-amber-500/10 text-amber-600', label: 'Read' },
      replied: { color: 'bg-emerald-500/10 text-emerald-600', label: 'Replied' },
      pending: { color: 'bg-muted text-muted-foreground', label: 'Pending' },
    };
    return configs[status] || configs.pending;
  };

  const handleStatusChange = (commId: string, newStatus: string) => {
    updateStatus.mutate({ id: commId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading communications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Communication Log
              <Badge variant="secondary" className="ml-2">{communications.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[160px]"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowLogDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Log Communication
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No communications found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery || typeFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Log your first communication to get started'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <Button onClick={() => setShowLogDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Log Communication
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCommunications.map((comm) => {
                const statusConfig = getStatusConfig(comm.status);

                return (
                  <div
                    key={comm.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-muted/50 mt-0.5">
                      {getTypeIcon(comm.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{comm.speaker?.name || 'Unknown Speaker'}</span>
                        <Badge className={`${statusConfig.color} text-[10px]`}>
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {comm.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-1">{comm.subject}</p>
                      {comm.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{comm.content}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comm.created_at), { addSuffix: true })}
                        </div>
                        {comm.sent_by_name && (
                          <span>by {comm.sent_by_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select 
                        value={comm.status} 
                        onValueChange={(value) => handleStatusChange(comm.id, value)}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LogCommunicationDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        workspaceId={workspaceId}
        speakers={speakers}
      />
    </div>
  );
}
