import { useState, useMemo } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, Loader2, User, Building } from 'lucide-react';
import { useOperationsTeamRoster } from '@/hooks/useOperationsDepartmentData';

interface TeamRosterTabProps {
  workspace: Workspace;
}

export function TeamRosterTab({ workspace }: TeamRosterTabProps) {
  const { data: teamMembers, isLoading } = useOperationsTeamRoster(workspace.id);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">Owner</Badge>;
      case 'MANAGER':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Manager</Badge>;
      case 'LEAD':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Lead</Badge>;
      case 'MEMBER':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Group members by role
  const groupedMembers = useMemo(() => {
    if (!teamMembers) return {};
    
    const filtered = teamMembers.filter(member => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (member.member_name?.toLowerCase().includes(searchLower)) ||
        (member.role?.toLowerCase().includes(searchLower)) ||
        (member.department?.toLowerCase().includes(searchLower))
      );
    });

    return filtered.reduce((acc, member) => {
      const role = member.role || 'MEMBER';
      if (!acc[role]) acc[role] = [];
      acc[role].push(member);
      return acc;
    }, {} as Record<string, typeof teamMembers>);
  }, [teamMembers, searchQuery]);

  const roleOrder = ['OWNER', 'MANAGER', 'LEAD', 'MEMBER'];
  const sortedRoles = Object.keys(groupedMembers).sort((a, b) => {
    return roleOrder.indexOf(a) - roleOrder.indexOf(b);
  });

  const totalMembers = teamMembers?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Team Roster</h2>
        <p className="text-muted-foreground">Operations department team members</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <Users className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{totalMembers}</div>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {(groupedMembers['MANAGER']?.length || 0) + (groupedMembers['LEAD']?.length || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Leadership</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{sortedRoles.length}</div>
                <p className="text-sm text-muted-foreground">Role Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, role, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>Grouped by role</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {sortedRoles.length > 0 ? (
              <div className="space-y-6">
                {sortedRoles.map((role) => (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-foreground">{role}</h3>
                      <Badge variant="outline" className="text-xs">
                        {groupedMembers[role].length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupedMembers[role].map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getInitials(member.member_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground truncate">
                                {member.member_name || 'Unknown User'}
                              </span>
                              {getRoleBadge(member.role)}
                            </div>
                            {member.department && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Building className="h-3 w-3" />
                                {member.department}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery ? 'No members match your search' : 'No team members found'}</p>
                <p className="text-sm">Team members will appear here once added</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
