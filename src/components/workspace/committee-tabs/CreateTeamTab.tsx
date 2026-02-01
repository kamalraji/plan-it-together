import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Plus, Settings, UserPlus, Folder, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateTeamTabProps {
  workspace: Workspace;
}

export function CreateTeamTab({ workspace }: CreateTeamTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing child teams
  const { data: childTeams, isLoading } = useQuery({
    queryKey: ['child-teams', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, created_at')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'TEAM')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch member counts for teams
  const { data: teamMemberCounts } = useQuery({
    queryKey: ['team-member-counts', childTeams?.map(t => t.id)],
    queryFn: async () => {
      if (!childTeams || childTeams.length === 0) return {};
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('workspace_id')
        .in('workspace_id', childTeams.map(t => t.id))
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(member => {
        counts[member.workspace_id] = (counts[member.workspace_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!childTeams && childTeams.length > 0,
  });

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('You must be logged in to create a team');
        return;
      }

      const slug = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { error } = await supabase
        .from('workspaces')
        .insert({
          name: teamName,
          slug,
          description: teamDescription || null,
          workspace_type: 'TEAM',
          parent_workspace_id: workspace.id,
          event_id: workspace.eventId!,
          organizer_id: user.user.id,
        });

      if (error) throw error;

      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['child-teams', workspace.id] });
      setShowCreateForm(false);
      setTeamName('');
      setTeamDescription('');
    } catch (_err) {
      toast.error('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Create Team
          </h2>
          <p className="text-muted-foreground mt-1">
            Organize volunteers into smaller teams
          </p>
        </div>
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{childTeams?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Teams</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {Object.values(teamMemberCounts || {}).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Team Members</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {childTeams?.length ? Math.round(Object.values(teamMemberCounts || {}).reduce((a, b) => a + b, 0) / childTeams.length) : 0}
            </div>
            <div className="text-xs text-muted-foreground">Avg Team Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-500" />
              Create New Team
            </CardTitle>
            <CardDescription>
              Create a sub-team under this committee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="e.g., Registration Desk A"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamDescription">Description (Optional)</Label>
              <Textarea
                id="teamDescription"
                placeholder="Brief description of this team's responsibilities..."
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleCreateTeam}
                disabled={!teamName.trim() || isCreating}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : !childTeams || childTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No teams created yet</p>
              <p className="text-sm mt-1">Create your first team to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {childTeams.map(team => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Folder className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{team.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {teamMemberCounts?.[team.id] || 0} members
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
                      {team.workspace_type}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
