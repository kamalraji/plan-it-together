import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useVolunteerShifts } from '@/hooks/useVolunteerShifts';
import { format } from 'date-fns';

interface AssignShiftsTabProps {
  workspace: Workspace;
}

export function AssignShiftsTab({ workspace }: AssignShiftsTabProps) {
  const { shifts, isLoading } = useVolunteerShifts(workspace.id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShifts = shifts?.filter(shift => 
    shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shift.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const upcomingShifts = filteredShifts.filter(shift => new Date(shift.date) >= new Date());
  const pastShifts = filteredShifts.filter(shift => new Date(shift.date) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-pink-500" />
            Assign Shifts
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage volunteer shifts for your team
          </p>
        </div>
        <Button className="bg-pink-500 hover:bg-pink-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Shift
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shifts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-pink-600">{shifts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Shifts</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{upcomingShifts.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {shifts?.reduce((acc, s) => acc + (s.requiredVolunteers || 0), 0) || 0}
            </div>
            <div className="text-xs text-muted-foreground">Volunteers Needed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{pastShifts.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      ) : upcomingShifts.length === 0 && pastShifts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-1">No shifts created</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first shift to start assigning volunteers
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Shift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Shifts */}
          {upcomingShifts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Upcoming Shifts
              </h3>
              <div className="grid gap-3">
                {upcomingShifts.map(shift => (
                  <Card key={shift.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-foreground">{shift.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {shift.requiredVolunteers} needed
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(shift.date), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                            {shift.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {shift.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Assign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Shifts */}
          {pastShifts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                Past Shifts
              </h3>
              <div className="grid gap-3 opacity-60">
                {pastShifts.slice(0, 5).map(shift => (
                  <Card key={shift.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{shift.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(shift.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <Badge variant="outline">Completed</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
