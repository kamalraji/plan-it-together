import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Plus, MapPin } from 'lucide-react';

interface Photographer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  type: 'photographer' | 'videographer' | 'drone';
  assignment: string;
  status: 'on_duty' | 'off_duty' | 'break';
  equipment: string[];
}

export function PhotographerRoster() {
  const [crew] = useState<Photographer[]>([
    {
      id: '1',
      name: 'Arjun Mehta',
      email: 'arjun@example.com',
      type: 'photographer',
      assignment: 'Main Stage',
      status: 'on_duty',
      equipment: ['Canon R5', '24-70mm', 'Flash'],
    },
    {
      id: '2',
      name: 'Priya Nair',
      email: 'priya@example.com',
      type: 'videographer',
      assignment: 'Roaming - Hall A',
      status: 'on_duty',
      equipment: ['Sony A7S III', 'Gimbal', 'Wireless Mic'],
    },
    {
      id: '3',
      name: 'Rahul Singh',
      email: 'rahul@example.com',
      type: 'drone',
      assignment: 'Aerial Coverage',
      status: 'break',
      equipment: ['DJI Mavic 3', 'Extra Batteries'],
    },
    {
      id: '4',
      name: 'Sneha Patel',
      email: 'sneha@example.com',
      type: 'photographer',
      assignment: 'VIP Lounge',
      status: 'on_duty',
      equipment: ['Nikon Z9', '70-200mm', 'Reflector'],
    },
  ]);

  const getTypeConfig = (type: Photographer['type']) => {
    switch (type) {
      case 'photographer':
        return { label: 'Photo', color: 'bg-blue-100 text-blue-800' };
      case 'videographer':
        return { label: 'Video', color: 'bg-purple-100 text-purple-800' };
      case 'drone':
        return { label: 'Drone', color: 'bg-amber-100 text-amber-800' };
    }
  };

  const getStatusColor = (status: Photographer['status']) => {
    switch (status) {
      case 'on_duty':
        return 'bg-green-100 text-green-800';
      case 'off_duty':
        return 'bg-gray-100 text-gray-800';
      case 'break':
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
        {crew.map((member) => {
          const typeConfig = getTypeConfig(member.type);

          return (
            <div key={member.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl} />
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {member.assignment}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(member.status)} variant="secondary">
                  {member.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {member.equipment.map((eq) => (
                  <Badge key={eq} variant="outline" className="text-xs">
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
