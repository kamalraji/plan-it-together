import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Plus, MapPin, Loader2 } from 'lucide-react';
import { useMediaCrew, MediaCrew } from '@/hooks/useMediaData';

interface PhotographerRosterProps {
  workspaceId: string;
}

export function PhotographerRoster({ workspaceId }: PhotographerRosterProps) {
  const { crew, isLoading } = useMediaCrew(workspaceId);

  const getTypeConfig = (type: MediaCrew['crew_type']) => {
    switch (type) {
      case 'photographer':
        return { label: 'Photo', color: 'bg-blue-100 text-blue-800' };
      case 'videographer':
        return { label: 'Video', color: 'bg-purple-100 text-purple-800' };
      case 'drone':
        return { label: 'Drone', color: 'bg-amber-100 text-amber-800' };
      case 'audio':
        return { label: 'Audio', color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  const getStatusColor = (status: MediaCrew['status']) => {
    switch (status) {
      case 'on_duty':
        return 'bg-green-100 text-green-800';
      case 'off_duty':
        return 'bg-muted text-foreground';
      case 'break':
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Media Crew
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Crew
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {crew.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No crew members added yet
          </p>
        ) : (
          crew.map((member) => {
            const typeConfig = getTypeConfig(member.crew_type);

            return (
              <div key={member.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <Badge className={typeConfig.color} variant="secondary">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      {member.assignment && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {member.assignment}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(member.status)} variant="secondary">
                    {member.status.replace('_', ' ')}
                  </Badge>
                </div>

                {member.equipment && member.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.equipment.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}