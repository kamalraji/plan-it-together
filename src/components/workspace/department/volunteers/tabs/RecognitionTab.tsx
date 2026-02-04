import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Star, Trophy, Heart, ThumbsUp, Medal, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVolunteerRecognitions, useRecognitionStats, useTopPerformers } from '@/hooks/useVolunteerRecognitions';

interface RecognitionTabProps {
  workspace: Workspace;
}

export function RecognitionTab({ workspace }: RecognitionTabProps) {
  const [selectedTab, setSelectedTab] = useState('feed');
  
  const { data: recognitions = [], isLoading } = useVolunteerRecognitions(workspace.id);
  const { stats } = useRecognitionStats(workspace.id);
  const { topPerformers } = useTopPerformers(workspace.id);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold text-rose-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Recognitions</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.stars}</div>
            <div className="text-xs text-muted-foreground">Star Awards</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.kudos}</div>
            <div className="text-xs text-muted-foreground">Kudos Given</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.milestones}</div>
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
              {recognitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No recognitions yet. Be the first to give kudos!</p>
                </div>
              ) : (
                recognitions.map(recognition => (
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
                          <span className="font-medium">{recognition.volunteerId}</span>
                          <Badge variant="outline" className="text-xs">
                            {recognition.title}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {recognition.description || 'Great work!'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recognition.awardedAt
                            ? new Date(recognition.awardedAt).toLocaleDateString()
                            : new Date(recognition.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
              <CardDescription>Based on recognitions received</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No performers to show yet</p>
                </div>
              ) : (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.volunteerId}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">
                        {index === 0 ? (
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Medal className="h-6 w-6 text-amber-600" />
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-rose-500/10 text-rose-600">
                          #{index + 1}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Volunteer #{index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {performer.kudosCount} recognitions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="font-bold">{performer.kudosCount}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
