import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, Mail, Check, X, Clock, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface RecruitmentTabProps {
  workspace: Workspace;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  skills: string[];
  availability: string;
}

const mockApplications: Application[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1 555-1234', appliedAt: '2024-01-10T10:00:00', status: 'pending', skills: ['Customer Service', 'Event Setup'], availability: 'Weekends' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 555-5678', appliedAt: '2024-01-09T14:00:00', status: 'pending', skills: ['First Aid', 'Leadership'], availability: 'Flexible' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1 555-9012', appliedAt: '2024-01-08T09:00:00', status: 'approved', skills: ['Technical', 'Audio/Video'], availability: 'Evenings' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1 555-3456', appliedAt: '2024-01-07T16:00:00', status: 'rejected', skills: ['Registration'], availability: 'Mornings Only' },
];

export function RecruitmentTab({ workspace: _workspace }: RecruitmentTabProps) {
  const [applications, setApplications] = useState(mockApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  const handleApprove = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as const } : a));
    toast.success('Application approved! Welcome email sent.');
  };

  const handleReject = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as const } : a));
    toast.success('Application rejected.');
  };

  const filteredApplications = applications.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || a.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-rose-500" />
            Recruitment
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage volunteer applications
          </p>
        </div>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Share Application Link
        </Button>
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
            <div className="text-2xl font-bold text-rose-600">{applications.length}</div>
            <div className="text-xs text-muted-foreground">Total Applications</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((approvedCount / applications.length) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Acceptance Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map(application => (
                    <div
                      key={application.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-rose-500/10 text-rose-600">
                              {application.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{application.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {application.email}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {application.skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Availability: {application.availability} • Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {application.status === 'pending' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(application.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleApprove(application.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </>
                          ) : (
                            <Badge 
                              variant="outline"
                              className={
                                application.status === 'approved' 
                                  ? 'border-emerald-500/30 text-emerald-600' 
                                  : 'border-red-500/30 text-red-600'
                              }
                            >
                              {application.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
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
