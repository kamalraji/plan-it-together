import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Plus, Search, Mail, Phone, MoreVertical, 
  Trash2, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useSpeakerLiaisonSpeakers, 
  useDeleteSpeaker,
  useUpdateSpeaker,
  Speaker 
} from '@/hooks/useSpeakerLiaisonData';
import { AddSpeakerDialog } from '../../../speaker-liaison/AddSpeakerDialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface SpeakerRosterTabProps {
  workspaceId: string;
}

export function SpeakerRosterTab({ workspaceId }: SpeakerRosterTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);

  const { data: speakers = [], isLoading } = useSpeakerLiaisonSpeakers(workspaceId);
  const deleteSpeaker = useDeleteSpeaker(workspaceId);
  const updateSpeaker = useUpdateSpeaker(workspaceId);

  const filteredSpeakers = speakers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.session_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ElementType }> = {
      confirmed: { color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
      pending: { color: 'bg-amber-500/10 text-amber-600', icon: Clock },
      cancelled: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${color} text-xs gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleStatusChange = (speaker: Speaker, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    updateSpeaker.mutate({ id: speaker.id, status: newStatus });
  };

  const handleDeleteConfirm = () => {
    if (speakerToDelete) {
      deleteSpeaker.mutate(speakerToDelete.id);
      setSpeakerToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading speakers...</p>
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
              <Users className="h-5 w-5 text-primary" />
              Speaker Roster
              <Badge variant="secondary" className="ml-2">{speakers.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search speakers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Speaker
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSpeakers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No speakers found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first speaker to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Speaker
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center gap-4 py-4 hover:bg-muted/30 -mx-4 px-4 rounded-lg transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={speaker.avatar_url || undefined} />
                    <AvatarFallback>
                      {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{speaker.name}</h4>
                      {getStatusBadge(speaker.status)}
                    </div>
                    {speaker.role && (
                      <p className="text-sm text-muted-foreground truncate">{speaker.role}</p>
                    )}
                    {speaker.session_title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        Session: {speaker.session_title}
                      </p>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    {speaker.email && (
                      <a href={`mailto:${speaker.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="hidden md:inline">{speaker.email}</span>
                      </a>
                    )}
                    {speaker.phone && (
                      <a href={`tel:${speaker.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="hidden lg:inline">{speaker.phone}</span>
                      </a>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(speaker, 'confirmed')}>
                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                        Mark Confirmed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(speaker, 'pending')}>
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        Mark Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(speaker, 'cancelled')}>
                        <XCircle className="h-4 w-4 mr-2 text-destructive" />
                        Mark Cancelled
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSpeakerToDelete(speaker)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Speaker
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSpeakerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        workspaceId={workspaceId}
      />

      <ConfirmationDialog
        open={!!speakerToDelete}
        onOpenChange={(open) => !open && setSpeakerToDelete(null)}
        title="Delete Speaker"
        description={`Are you sure you want to remove ${speakerToDelete?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}
