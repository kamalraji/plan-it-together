import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, CheckCircle, Clock, AlertTriangle, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TrainingStatusTabProps {
  workspace: Workspace;
}

interface TrainingModule {
  id: string;
  name: string;
  required: boolean;
  completedCount: number;
  totalCount: number;
}

interface VolunteerTraining {
  id: string;
  name: string;
  email: string;
  completedModules: number;
  totalModules: number;
  status: 'completed' | 'in_progress' | 'not_started';
}

// Mock data
const mockModules: TrainingModule[] = [
  { id: '1', name: 'Safety & Emergency Procedures', required: true, completedCount: 12, totalCount: 20 },
  { id: '2', name: 'Customer Service Excellence', required: true, completedCount: 18, totalCount: 20 },
  { id: '3', name: 'Event Operations Overview', required: true, completedCount: 15, totalCount: 20 },
  { id: '4', name: 'First Aid Basics', required: false, completedCount: 8, totalCount: 20 },
];

const mockVolunteers: VolunteerTraining[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', completedModules: 4, totalModules: 4, status: 'completed' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', completedModules: 3, totalModules: 4, status: 'in_progress' },
  { id: '3', name: 'Carol Davis', email: 'carol@example.com', completedModules: 2, totalModules: 4, status: 'in_progress' },
  { id: '4', name: 'David Wilson', email: 'david@example.com', completedModules: 0, totalModules: 4, status: 'not_started' },
];

export function TrainingStatusTab({ workspace }: TrainingStatusTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  const filteredVolunteers = mockVolunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || v.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const completedCount = mockVolunteers.filter(v => v.status === 'completed').length;
  const inProgressCount = mockVolunteers.filter(v => v.status === 'in_progress').length;
  const notStartedCount = mockVolunteers.filter(v => v.status === 'not_started').length;

  const overallProgress = Math.round(
    (mockVolunteers.reduce((acc, v) => acc + v.completedModules, 0) / 
     mockVolunteers.reduce((acc, v) => acc + v.totalModules, 0)) * 100
  );

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
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
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
          <CardDescription>Required and optional training for volunteers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockModules.map(module => (
            <div key={module.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{module.name}</span>
                  {module.required && (
                    <Badge variant="outline" className="text-xs border-red-500/30 text-red-600">
                      Required
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {module.completedCount}/{module.totalCount} completed
                </span>
              </div>
              <Progress 
                value={(module.completedCount / module.totalCount) * 100} 
                className="h-2"
              />
            </div>
          ))}
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
          <div className="space-y-3">
            {filteredVolunteers.map(volunteer => (
              <div
                key={volunteer.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                      {volunteer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{volunteer.name}</p>
                    <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {volunteer.completedModules}/{volunteer.totalModules} modules
                    </p>
                    <Progress 
                      value={(volunteer.completedModules / volunteer.totalModules) * 100}
                      className="h-1.5 w-24"
                    />
                  </div>
                  <Badge 
                    variant="outline"
                    className={
                      volunteer.status === 'completed' ? 'border-emerald-500/30 text-emerald-600' :
                      volunteer.status === 'in_progress' ? 'border-blue-500/30 text-blue-600' :
                      'border-red-500/30 text-red-600'
                    }
                  >
                    {volunteer.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {volunteer.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                    {volunteer.status === 'not_started' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {volunteer.status === 'completed' ? 'Complete' :
                     volunteer.status === 'in_progress' ? 'In Progress' :
                     'Not Started'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
