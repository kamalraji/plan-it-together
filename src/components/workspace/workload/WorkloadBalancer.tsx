/**
 * WorkloadBalancer - Visual workload distribution view
 */
import React from 'react';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
  capacity_hours: number;
  assigned_hours: number;
  task_count: number;
}

interface WorkloadBalancerProps {
  members: TeamMember[];
  workspaceName?: string;
  className?: string;
}

export const WorkloadBalancer: React.FC<WorkloadBalancerProps> = ({
  members,
  workspaceName,
  className,
}) => {
  const getUtilization = (member: TeamMember) => {
    if (member.capacity_hours === 0) return 0;
    return Math.round((member.assigned_hours / member.capacity_hours) * 100);
  };

  const getStatusColor = (utilization: number) => {
    if (utilization > 100) return 'text-destructive';
    if (utilization > 80) return 'text-yellow-500';
    if (utilization < 50) return 'text-muted-foreground';
    return 'text-green-500';
  };

  const getStatusBadge = (utilization: number) => {
    if (utilization > 100) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overloaded
        </Badge>
      );
    }
    if (utilization > 80) {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
          At Capacity
        </Badge>
      );
    }
    if (utilization < 30) {
      return (
        <Badge variant="secondary" className="text-xs">
          Available
        </Badge>
      );
    }
    return null;
  };

  const sortedMembers = [...members].sort(
    (a, b) => getUtilization(b) - getUtilization(a)
  );

  const overloadedCount = members.filter((m) => getUtilization(m) > 100).length;
  const totalCapacity = members.reduce((sum, m) => sum + m.capacity_hours, 0);
  const totalAssigned = members.reduce((sum, m) => sum + m.assigned_hours, 0);
  const averageUtilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Workload
            {workspaceName && (
              <span className="text-sm font-normal text-muted-foreground">
                • {workspaceName}
              </span>
            )}
          </CardTitle>
          {overloadedCount > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overloadedCount} overloaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{totalAssigned}h</p>
            <p className="text-xs text-muted-foreground">Hours Assigned</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className={cn('text-2xl font-bold', getStatusColor(averageUtilization))}>
              {averageUtilization}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-4">
          {sortedMembers.map((member) => {
            const utilization = getUtilization(member);
            return (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {member.assigned_hours}h / {member.capacity_hours}h
                        <span className="mx-1">•</span>
                        {member.task_count} tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(utilization)}
                    <span className={cn('text-sm font-medium', getStatusColor(utilization))}>
                      {utilization}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.min(utilization, 100)}
                  className={cn(
                    'h-2',
                    utilization > 100 && '[&>div]:bg-destructive',
                    utilization > 80 && utilization <= 100 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
