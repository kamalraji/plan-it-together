import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useSpeakerLiaisonSpeakers, useCreateCommunication, Speaker } from '@/hooks/useSpeakerLiaisonData';
import { Workspace } from '@/types';
import { format } from 'date-fns';
import { AddSpeakerDialog } from './AddSpeakerDialog';

interface SpeakerRosterProps {
  workspace?: Workspace;
  maxSpeakers?: number;
  onViewAll?: () => void;
}

export function SpeakerRoster({ workspace, maxSpeakers = 5, onViewAll }: SpeakerRosterProps) {
  const { data: speakers = [], isLoading } = useSpeakerLiaisonSpeakers(workspace?.id);
  const createCommunication = useCreateCommunication(workspace?.id);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const displaySpeakers = maxSpeakers ? speakers.slice(0, maxSpeakers) : speakers;

  const getStatusConfig = (status: string, speaker: Speaker) => {
    // Check if awaiting materials
    const missingMaterials = !speaker.bio_submitted || !speaker.photo_submitted || !speaker.presentation_submitted;
    
    if (status === 'confirmed' && missingMaterials) {
      return { 
        color: 'bg-blue-500/10 text-blue-600', 
        icon: <AlertCircle className="h-3 w-3" />, 
        label: 'Awaiting Materials' 
      };
    }
    
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      confirmed: { 
        color: 'bg-emerald-500/10 text-emerald-600', 
        icon: <CheckCircle2 className="h-3 w-3" />, 
        label: 'Confirmed' 
      },
      pending: { 
        color: 'bg-amber-500/10 text-amber-600', 
        icon: <Clock className="h-3 w-3" />, 
        label: 'Pending' 
      },
      cancelled: { 
        color: 'bg-destructive/10 text-destructive', 
        icon: <AlertCircle className="h-3 w-3" />, 
        label: 'Cancelled' 
      },
    };
    return configs[status] || configs.pending;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSendReminder = (speaker: Speaker) => {
    createCommunication.mutate({
      speaker_id: speaker.id,
      type: 'email',
      subject: 'Reminder: Please submit your materials',
      status: 'sent',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Speaker Roster
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
              {onViewAll && speakers.length > maxSpeakers && (
                <Button variant="outline" size="sm" onClick={onViewAll}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {speakers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No speakers added yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add First Speaker
              </Button>
            </div>
          ) : (
            displaySpeakers.map((speaker) => {
              const statusConfig = getStatusConfig(speaker.status, speaker);
              const materialsComplete = speaker.bio_submitted && speaker.photo_submitted && speaker.presentation_submitted;
              
              return (
                <div
                  key={speaker.id}
                  className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={speaker.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(speaker.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{speaker.name}</p>
                        <Badge className={`${statusConfig.color} text-xs shrink-0`}>
                          <span className="mr-1">{statusConfig.icon}</span>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {speaker.session_title || speaker.role || 'No session assigned'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {speaker.session_time 
                            ? format(new Date(speaker.session_time), 'MMM d, h:mm a')
                            : 'No time scheduled'}
                        </span>
                        <div className="flex items-center gap-1" title="Bio | Photo | Presentation">
                          <div className={`w-2 h-2 rounded-full ${speaker.bio_submitted ? 'bg-emerald-500' : 'bg-muted'}`} />
                          <div className={`w-2 h-2 rounded-full ${speaker.photo_submitted ? 'bg-emerald-500' : 'bg-muted'}`} />
                          <div className={`w-2 h-2 rounded-full ${speaker.presentation_submitted ? 'bg-emerald-500' : 'bg-muted'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {!materialsComplete && speaker.status !== 'cancelled' && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs w-full"
                        onClick={() => handleSendReminder(speaker)}
                        disabled={createCommunication.isPending}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Send Reminder
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AddSpeakerDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        workspaceId={workspace?.id}
      />
    </>
  );
}
