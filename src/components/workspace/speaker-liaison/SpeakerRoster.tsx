import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  email: string;
  topic: string;
  sessionTime: string;
  status: 'confirmed' | 'pending' | 'awaiting_materials';
  bioSubmitted: boolean;
  photoSubmitted: boolean;
  presentationSubmitted: boolean;
}

export function SpeakerRoster() {
  const speakers: Speaker[] = [
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@example.com',
      topic: 'Future of AI in Healthcare',
      sessionTime: 'Jan 15, 10:00 AM',
      status: 'confirmed',
      bioSubmitted: true,
      photoSubmitted: true,
      presentationSubmitted: true,
    },
    {
      id: '2',
      name: 'James Wilson',
      email: 'j.wilson@example.com',
      topic: 'Sustainable Tech Practices',
      sessionTime: 'Jan 15, 2:00 PM',
      status: 'awaiting_materials',
      bioSubmitted: true,
      photoSubmitted: true,
      presentationSubmitted: false,
    },
    {
      id: '3',
      name: 'Maria Garcia',
      email: 'm.garcia@example.com',
      topic: 'Building Inclusive Teams',
      sessionTime: 'Jan 16, 11:00 AM',
      status: 'pending',
      bioSubmitted: false,
      photoSubmitted: false,
      presentationSubmitted: false,
    },
    {
      id: '4',
      name: 'Prof. Robert Kim',
      email: 'r.kim@example.com',
      topic: 'Data Privacy Regulations',
      sessionTime: 'Jan 16, 3:00 PM',
      status: 'confirmed',
      bioSubmitted: true,
      photoSubmitted: true,
      presentationSubmitted: true,
    },
  ];

  const getStatusConfig = (status: string) => {
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
      awaiting_materials: { 
        color: 'bg-blue-500/10 text-blue-600', 
        icon: <AlertCircle className="h-3 w-3" />, 
        label: 'Awaiting Materials' 
      },
    };
    return configs[status] || configs.pending;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Speaker Roster
          </CardTitle>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {speakers.map((speaker) => {
          const statusConfig = getStatusConfig(speaker.status);
          const materialsComplete = speaker.bioSubmitted && speaker.photoSubmitted && speaker.presentationSubmitted;
          
          return (
            <div
              key={speaker.id}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
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
                  <p className="text-xs text-muted-foreground truncate mb-1">{speaker.topic}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{speaker.sessionTime}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${speaker.bioSubmitted ? 'bg-emerald-500' : 'bg-muted'}`} title="Bio" />
                      <div className={`w-2 h-2 rounded-full ${speaker.photoSubmitted ? 'bg-emerald-500' : 'bg-muted'}`} title="Photo" />
                      <div className={`w-2 h-2 rounded-full ${speaker.presentationSubmitted ? 'bg-emerald-500' : 'bg-muted'}`} title="Presentation" />
                    </div>
                  </div>
                </div>
              </div>
              {!materialsComplete && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Button variant="ghost" size="sm" className="h-7 text-xs w-full">
                    <Mail className="h-3 w-3 mr-1" />
                    Send Reminder
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
