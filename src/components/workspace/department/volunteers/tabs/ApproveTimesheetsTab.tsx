import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ApproveTimesheetsTabProps {
  workspace: Workspace;
}

interface TimesheetEntry {
  id: string;
  volunteerName: string;
  shiftName: string;
  date: string;
  hoursLogged: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

const mockTimesheets: TimesheetEntry[] = [
  { id: '1', volunteerName: 'Alice Johnson', shiftName: 'Morning Registration', date: '2024-01-10', hoursLogged: 4.5, status: 'pending' },
  { id: '2', volunteerName: 'Bob Smith', shiftName: 'Afternoon Support', date: '2024-01-10', hoursLogged: 5, status: 'pending' },
  { id: '3', volunteerName: 'Carol Davis', shiftName: 'Evening Setup', date: '2024-01-09', hoursLogged: 3.5, status: 'pending' },
  { id: '4', volunteerName: 'David Wilson', shiftName: 'Morning Registration', date: '2024-01-09', hoursLogged: 4, status: 'approved' },
  { id: '5', volunteerName: 'Emma Brown', shiftName: 'Afternoon Support', date: '2024-01-08', hoursLogged: 4.5, status: 'approved' },
];

export function ApproveTimesheetsTab({ workspace: _workspace }: ApproveTimesheetsTabProps) {
  const [timesheets, setTimesheets] = useState(mockTimesheets);
  const [selectedTab, setSelectedTab] = useState('pending');

  const pendingCount = timesheets.filter(t => t.status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.status === 'approved').length;
  const totalHoursPending = timesheets.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.hoursLogged, 0);

  const handleApprove = (id: string) => {
    setTimesheets(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' as const } : t));
    toast.success('Timesheet approved');
  };

  const handleReject = (id: string) => {
    setTimesheets(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' as const } : t));
    toast.success('Timesheet rejected');
  };

  const handleApproveAll = () => {
    setTimesheets(prev => prev.map(t => t.status === 'pending' ? { ...t, status: 'approved' as const } : t));
    toast.success('All pending timesheets approved');
  };

  const filteredTimesheets = timesheets.filter(t => {
    if (selectedTab === 'pending') return t.status === 'pending';
    if (selectedTab === 'approved') return t.status === 'approved';
    if (selectedTab === 'rejected') return t.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-rose-500" />
            Approve Timesheets
          </h2>
          <p className="text-muted-foreground mt-1">
            Review and approve volunteer time entries
          </p>
        </div>
        {pendingCount > 0 && (
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleApproveAll}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve All ({pendingCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{totalHoursPending}h</div>
            <div className="text-xs text-muted-foreground">Hours Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{timesheets.length}</div>
            <div className="text-xs text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedTab === 'pending' ? 'Pending Timesheets' : 
                 selectedTab === 'approved' ? 'Approved Timesheets' : 'All Timesheets'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTimesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No timesheets in this category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTimesheets.map(timesheet => (
                    <div
                      key={timesheet.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-rose-500/10 text-rose-600">
                            {timesheet.volunteerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{timesheet.volunteerName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{timesheet.shiftName}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{new Date(timesheet.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{timesheet.hoursLogged}h</p>
                          <p className="text-xs text-muted-foreground">logged</p>
                        </div>
                        {timesheet.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(timesheet.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleApprove(timesheet.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge 
                            variant="outline"
                            className={
                              timesheet.status === 'approved' 
                                ? 'border-emerald-500/30 text-emerald-600' 
                                : 'border-red-500/30 text-red-600'
                            }
                          >
                            {timesheet.status === 'approved' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                            ) : (
                              <><X className="h-3 w-3 mr-1" /> Rejected</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
