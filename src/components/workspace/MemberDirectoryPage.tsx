import { useState } from 'react';
import { useMemberDirectory, DirectoryMember } from '@/hooks/useMemberDirectory';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Building2,
  Briefcase,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKSPACE_TYPE_COLORS: Record<string, string> = {
  ROOT: 'bg-primary/10 text-primary border-primary/20',
  DEPARTMENT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  COMMITTEE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  TEAM: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

function MemberCard({ member, onClick }: { member: DirectoryMember; onClick: () => void }) {
  const initials = member.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const primaryMembership = member.workspaceMemberships[0];
  const additionalCount = member.workspaceMemberships.length - 1;

  return (
    <div
      className="group p-4 border border-border/50 rounded-xl bg-card hover:bg-muted/30 hover:border-border transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {member.fullName}
            </h4>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>

          {member.organization && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              {member.organization}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1">
            {primaryMembership && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  WORKSPACE_TYPE_COLORS[primaryMembership.workspaceType || ''] || 'bg-muted'
                )}
              >
                {primaryMembership.workspaceName}
              </Badge>
            )}
            {additionalCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{additionalCount} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberDetailDialog({ 
  member, 
  isOpen, 
  onClose 
}: { 
  member: DirectoryMember | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!member) return null;

  const initials = member.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Member Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{member.fullName}</h3>
              {member.organization && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {member.organization}
                </p>
              )}
            </div>
          </div>

          {/* Workspace Memberships */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Workspace Memberships ({member.workspaceMemberships.length})
            </h4>
            <div className="space-y-2">
              {member.workspaceMemberships.map((wm, index) => (
                <div
                  key={`${wm.workspaceId}-${index}`}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{wm.workspaceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {wm.role.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {wm.workspaceType && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          WORKSPACE_TYPE_COLORS[wm.workspaceType] || 'bg-muted'
                        )}
                      >
                        {wm.workspaceType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MemberDirectoryPageProps {
  eventId: string;
}

export function MemberDirectoryPage({ eventId }: MemberDirectoryPageProps) {
  const {
    members,
    totalCount,
    filteredCount,
    isLoading,
    searchQuery,
    setSearchQuery,
    workspaceTypeFilter,
    setWorkspaceTypeFilter,
    roleFilter,
    setRoleFilter,
    filterOptions,
  } = useMemberDirectory({ eventId });

  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);

  const hasFilters = !!workspaceTypeFilter || !!roleFilter;

  const clearFilters = () => {
    setWorkspaceTypeFilter(null);
    setRoleFilter(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Member Directory
        </h2>
        <p className="text-muted-foreground text-sm">
          {totalCount} members across all event workspaces
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, organization, or workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Workspace Type Filter */}
            <Select
              value={workspaceTypeFilter || 'all'}
              onValueChange={(v) => setWorkspaceTypeFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Workspace Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.workspaceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select
              value={roleFilter || 'all'}
              onValueChange={(v) => setRoleFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {filterOptions.roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {(searchQuery || hasFilters) && (
            <p className="text-xs text-muted-foreground mt-3">
              Showing {filteredCount} of {totalCount} members
            </p>
          )}
        </CardContent>
      </Card>

      {/* Member Grid */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No members found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {searchQuery || hasFilters
              ? 'Try adjusting your search or filters'
              : 'No team members have been added to workspaces yet'
            }
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                onClick={() => setSelectedMember(member)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Member Detail Dialog */}
      <MemberDetailDialog
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

export default MemberDirectoryPage;
