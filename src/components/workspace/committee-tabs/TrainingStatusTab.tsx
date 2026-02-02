import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, CheckCircle, Clock, AlertTriangle, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrainingModules, useVolunteerTrainingProgress, useTrainingStats } from '@/hooks/useTrainingModules';

interface TrainingStatusTabProps {
  workspace: Workspace;
}

export function TrainingStatusTab({ workspace }: TrainingStatusTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  const { data: modules = [], isLoading: modulesLoading, refetch: refetchModules, isFetching: fetchingModules } = useTrainingModules(workspace.id);
  const { data: volunteers = [], isLoading: volunteersLoading, refetch: refetchVolunteers, isFetching: fetchingVolunteers } = useVolunteerTrainingProgress(workspace.id);
  const stats = useTrainingStats(workspace.id);

  const isLoading = modulesLoading || volunteersLoading;
  const isFetching = fetchingModules || fetchingVolunteers;

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.volunteerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Determine volunteer status
    const status = v.percentComplete === 100 ? 'completed' : 
                   v.inProgressModules > 0 ? 'in_progress' : 'not_started';
    
    const matchesFilter = selectedFilter === 'all' || status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const completedCount = volunteers.filter(v => v.percentComplete === 100).length;
  const inProgressCount = volunteers.filter(v => v.inProgressModules > 0 && v.percentComplete < 100).length;
  const notStartedCount = volunteers.filter(v => v.percentComplete === 0 && v.inProgressModules === 0).length;

  const overallProgress = stats.averageCompletion;

  const handleRefresh = () => {
    refetchModules();
    refetchVolunteers();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-amber-500" />
            Training Status
          </h2>
          <p className="text-muted-foreground mt-1">
            Track volunteer training completion
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Fully Trained</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{notStartedCount}</div>
            <div className="text-xs text-muted-foreground">Not Started</div>
          </CardContent>
        </Card>
      </div>

      {/* Training Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Modules</CardTitle>
          <CardDescription>
            {modules.length > 0 
              ? `${modules.filter(m => m.is_required).length} required, ${modules.filter(m => !m.is_required).length} optional`
              : 'No training modules created yet'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No training modules yet</p>
              <p className="text-sm">Create modules to track volunteer training</p>
            </div>
          ) : (
            modules.map(module => {
              // Calculate completion for this module
              const completedVolunteers = volunteers.filter(v => 
                v.modules.some(m => m.moduleId === module.id && m.status === 'completed')
              ).length;
              const totalVolunteers = volunteers.length || 1;
              const completionPercent = Math.round((completedVolunteers / totalVolunteers) * 100);

              return (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{module.name}</span>
                      {module.is_required && (
                        <Badge variant="outline" className="text-xs border-red-500/30 text-red-600">
                          Required
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {completedVolunteers}/{totalVolunteers} completed
                    </span>
                  </div>
                  <Progress 
                    value={completionPercent} 
                    className="h-2"
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Volunteer Progress */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="text-lg">Volunteer Progress</CardTitle>
              <CardDescription>Individual training completion status</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 w-48"
                />
              </div>
            </div>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2 mt-4">
            {(['all', 'completed', 'in_progress', 'not_started'] as const).map(filter => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className={selectedFilter === filter ? '' : 'text-muted-foreground'}
              >
                {filter === 'all' ? 'All' :
                 filter === 'completed' ? 'Completed' :
                 filter === 'in_progress' ? 'In Progress' :
                 'Not Started'}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No volunteers found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVolunteers.map(volunteer => {
                const status = volunteer.percentComplete === 100 ? 'completed' : 
                               volunteer.inProgressModules > 0 ? 'in_progress' : 'not_started';

                return (
                  <div
                    key={volunteer.volunteerId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                          {volunteer.volunteerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{volunteer.volunteerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {volunteer.completedModules} of {volunteer.totalModules} modules
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {volunteer.percentComplete}%
                        </p>
                        <Progress 
                          value={volunteer.percentComplete}
                          className="h-1.5 w-24"
                        />
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          status === 'completed' ? 'border-emerald-500/30 text-emerald-600' :
                          status === 'in_progress' ? 'border-blue-500/30 text-blue-600' :
                          'border-red-500/30 text-red-600'
                        }
                      >
                        {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                        {status === 'not_started' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {status === 'completed' ? 'Complete' :
                         status === 'in_progress' ? 'In Progress' :
                         'Not Started'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
