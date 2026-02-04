import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Star, Trophy, Heart, ThumbsUp, Medal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RecognitionTabProps {
  workspace: Workspace;
}

interface Recognition {
  id: string;
  recipientName: string;
  type: 'kudos' | 'star' | 'award' | 'milestone';
  title: string;
  message: string;
  givenBy: string;
  givenAt: string;
}

interface TopPerformer {
  id: string;
  name: string;
  kudosCount: number;
  hoursLogged: number;
  shiftsCompleted: number;
  rank: number;
}

const mockRecognitions: Recognition[] = [
  { id: '1', recipientName: 'Alice Johnson', type: 'star', title: 'Star Volunteer', message: 'Outstanding dedication during the event setup!', givenBy: 'Sarah Manager', givenAt: '2024-01-10T10:00:00' },
  { id: '2', recipientName: 'Bob Smith', type: 'kudos', title: 'Team Player', message: 'Always ready to help others and take on extra tasks.', givenBy: 'Team Lead', givenAt: '2024-01-09T14:00:00' },
  { id: '3', recipientName: 'Carol Davis', type: 'milestone', title: '50 Hours Milestone', message: 'Congratulations on reaching 50 volunteer hours!', givenBy: 'System', givenAt: '2024-01-08T09:00:00' },
  { id: '4', recipientName: 'David Wilson', type: 'award', title: 'Most Reliable', message: 'Perfect attendance record for 3 months straight.', givenBy: 'HR Team', givenAt: '2024-01-07T16:00:00' },
];

const mockTopPerformers: TopPerformer[] = [
  { id: '1', name: 'Alice Johnson', kudosCount: 12, hoursLogged: 48, shiftsCompleted: 15, rank: 1 },
  { id: '2', name: 'Bob Smith', kudosCount: 10, hoursLogged: 42, shiftsCompleted: 13, rank: 2 },
  { id: '3', name: 'Carol Davis', kudosCount: 8, hoursLogged: 38, shiftsCompleted: 11, rank: 3 },
];

export function RecognitionTab({ workspace: _workspace }: RecognitionTabProps) {
  const [selectedTab, setSelectedTab] = useState('feed');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'star': return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
      case 'kudos': return <ThumbsUp className="h-4 w-4 text-blue-500" />;
      case 'award': return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'milestone': return <Medal className="h-4 w-4 text-purple-500" />;
      default: return <Heart className="h-4 w-4 text-rose-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'star': return 'bg-yellow-500/10';
      case 'kudos': return 'bg-blue-500/10';
      case 'award': return 'bg-amber-500/10';
      case 'milestone': return 'bg-purple-500/10';
      default: return 'bg-rose-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-rose-500" />
            Recognition
          </h2>
          <p className="text-muted-foreground mt-1">
            Celebrate volunteer achievements
          </p>
        </div>
        <Button className="bg-rose-500 hover:bg-rose-600 text-white">
          <Sparkles className="h-4 w-4 mr-2" />
          Give Recognition
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{mockRecognitions.length}</div>
            <div className="text-xs text-muted-foreground">Total Recognitions</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {mockRecognitions.filter(r => r.type === 'star').length}
            </div>
            <div className="text-xs text-muted-foreground">Star Awards</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockRecognitions.filter(r => r.type === 'kudos').length}
            </div>
            <div className="text-xs text-muted-foreground">Kudos Given</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {mockRecognitions.filter(r => r.type === 'milestone').length}
            </div>
            <div className="text-xs text-muted-foreground">Milestones</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="feed">Recognition Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Recognitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRecognitions.map(recognition => (
                <div
                  key={recognition.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeBg(recognition.type)}`}>
                      {getTypeIcon(recognition.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{recognition.recipientName}</span>
                        <Badge variant="outline" className="text-xs">
                          {recognition.title}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recognition.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {recognition.givenBy} • {new Date(recognition.givenAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
              <CardDescription>Based on recognitions, hours, and shifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockTopPerformers.map(performer => (
                <div
                  key={performer.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {performer.rank === 1 ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : performer.rank === 2 ? (
                        <Medal className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Medal className="h-6 w-6 text-amber-600" />
                      )}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-rose-500/10 text-rose-600">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.shiftsCompleted} shifts • {performer.hoursLogged}h logged
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-blue-500" />
                    <span className="font-bold">{performer.kudosCount}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
