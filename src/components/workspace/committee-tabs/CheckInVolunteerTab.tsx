import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, Search, QrCode, Clock, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useVolunteerShifts, VolunteerAssignment } from '@/hooks/useVolunteerShifts';
import { format } from 'date-fns';

interface CheckInVolunteerTabProps {
  workspace: Workspace;
}

export function CheckInVolunteerTab({ workspace }: CheckInVolunteerTabProps) {
  const { shifts, checkInVolunteer, checkOutVolunteer, getShiftAssignments } = useVolunteerShifts(workspace.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftAssignments, setShiftAssignments] = useState<VolunteerAssignment[]>([]);

  // Get today's shifts
  const today = new Date().toISOString().split('T')[0];
  const todaysShifts = shifts?.filter(shift => shift.date === today) || [];

  const handleShiftSelect = async (shiftId: string) => {
    setSelectedShiftId(shiftId);
    const assignments = await getShiftAssignments(shiftId);
    setShiftAssignments(assignments);
  };

  const checkedInCount = shiftAssignments.filter(a => a.checkInTime).length;
  const pendingCount = shiftAssignments.filter(a => !a.checkInTime).length;

  const handleCheckIn = async (assignmentId: string) => {
    await checkInVolunteer.mutateAsync({ shiftId: selectedShiftId!, userId: assignmentId });
    if (selectedShiftId) {
      const assignments = await getShiftAssignments(selectedShiftId);
      setShiftAssignments(assignments);
    }
  };

  const handleCheckOut = async (assignmentId: string) => {
    await checkOutVolunteer.mutateAsync({ shiftId: selectedShiftId!, userId: assignmentId });
    if (selectedShiftId) {
      const assignments = await getShiftAssignments(selectedShiftId);
      setShiftAssignments(assignments);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-500" />
            Check-in Volunteers
          </h2>
          <p className="text-muted-foreground mt-1">
            Track volunteer attendance and hours
          </p>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <QrCode className="h-4 w-4 mr-2" />
          Scan QR Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{checkedInCount}</div>
            <div className="text-xs text-muted-foreground">Checked In</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{todaysShifts.length}</div>
            <div className="text-xs text-muted-foreground">Today's Shifts</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {checkedInCount > 0 ? Math.round((checkedInCount / (checkedInCount + pendingCount)) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Check-in Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Shifts</CardTitle>
          <CardDescription>Select a shift to manage check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No shifts scheduled for today</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {todaysShifts.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => handleShiftSelect(shift.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedShiftId === shift.id 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'hover:border-border/60 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{shift.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime} • {shift.location || 'No location'}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {shift.requiredVolunteers} volunteers
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volunteer List */}
      {selectedShiftId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Assigned Volunteers</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search volunteers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {shiftAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No volunteers assigned to this shift</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shiftAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {assignment.userId.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">Volunteer</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.checkInTime 
                            ? `Checked in at ${format(new Date(assignment.checkInTime), 'h:mm a')}`
                            : 'Not checked in'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignment.checkInTime ? (
                        <>
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                          {!assignment.checkOutTime && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCheckOut(assignment.id)}
                            >
                              Check Out
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleCheckIn(assignment.id)}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
