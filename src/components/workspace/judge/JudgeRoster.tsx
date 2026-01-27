import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, Mail } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  expertise: string[];
  assignedCount: number;
  completedCount: number;
  status: 'active' | 'inactive' | 'on_break';
}

interface JudgeRosterProps {
  workspaceId?: string;
}

export function JudgeRoster(_props: JudgeRosterProps) {
  // Mock data - in production, fetch from database
  const [judges] = useState<Judge[]>([
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@example.com',
      expertise: ['AI/ML', 'Data Science'],
      assignedCount: 12,
      completedCount: 8,
      status: 'active',
    },
    {
      id: '2',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      expertise: ['Web Development', 'Cloud'],
      assignedCount: 10,
      completedCount: 10,
      status: 'active',
    },
    {
      id: '3',
      name: 'Anita Desai',
      email: 'anita.desai@example.com',
      expertise: ['Mobile Apps', 'UX Design'],
      assignedCount: 8,
      completedCount: 5,
      status: 'active',
    },
    {
      id: '4',
      name: 'Vikram Patel',
      email: 'vikram.patel@example.com',
      expertise: ['Blockchain', 'FinTech'],
      assignedCount: 6,
      completedCount: 2,
      status: 'on_break',
    },
  ]);

  const getStatusColor = (status: Judge['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-muted text-foreground';
      case 'on_break':
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
          <Users className="h-5 w-5 text-primary" />
          Judge Panel
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Judge
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {judges.map((judge) => {
          const progressPercent = judge.assignedCount > 0 
            ? (judge.completedCount / judge.assignedCount) * 100 
            : 0;

          return (
            <div key={judge.id} className="p-3 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={judge.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(judge.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{judge.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {judge.email}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(judge.status)} variant="secondary">
                  {judge.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {judge.expertise.map((exp) => (
                  <Badge key={exp} variant="outline" className="text-xs">
                    {exp}
                  </Badge>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Evaluation Progress</span>
                  <span className="font-medium">
                    {judge.completedCount}/{judge.assignedCount}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
