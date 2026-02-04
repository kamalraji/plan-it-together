import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Map, 
  Plus, 
  Play, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useVenueWalkthroughs,
  useCreateWalkthrough,
  useStartWalkthrough,
  useCompleteWalkthrough,
  useAddWalkthroughFinding,
  useRooms,
  VenueWalkthrough,
} from '@/hooks/useFacilityCommitteeData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VenueWalkthroughTabProps {
  workspaceId: string;
}

export function VenueWalkthroughTab({ workspaceId }: VenueWalkthroughTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeWalkthrough, setActiveWalkthrough] = useState<VenueWalkthrough | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    scheduled_date: '',
    scheduled_time: '',
    lead_name: '',
    attendees: '',
  });
  const [findingForm, setFindingForm] = useState({
    area: '',
    issue: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
  });

  const { data: walkthroughs, isLoading } = useVenueWalkthroughs(workspaceId);
  const { data: rooms } = useRooms(workspaceId);
  const createWalkthrough = useCreateWalkthrough(workspaceId);
  const startWalkthrough = useStartWalkthrough(workspaceId);
  const completeWalkthrough = useCompleteWalkthrough(workspaceId);
  const addFinding = useAddWalkthroughFinding(workspaceId);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', variant: 'outline' as const, icon: Clock, color: 'text-blue-500' };
      case 'in_progress':
        return { label: 'In Progress', variant: 'default' as const, icon: Play, color: 'text-amber-500' };
      case 'completed':
        return { label: 'Completed', variant: 'secondary' as const, icon: CheckCircle, color: 'text-emerald-500' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' };
    }
  };

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createWalkthrough.mutate({
      name: formData.name,
      scheduled_date: formData.scheduled_date || undefined,
      scheduled_time: formData.scheduled_time || undefined,
      lead_name: formData.lead_name || undefined,
      attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : undefined,
    }, {
      onSuccess: () => {
        setFormData({ name: '', scheduled_date: '', scheduled_time: '', lead_name: '', attendees: '' });
        setIsAdding(false);
      },
    });
  };

  const handleAddFinding = () => {
    if (!activeWalkthrough || !findingForm.area.trim() || !findingForm.issue.trim()) return;
    addFinding.mutate({
      id: activeWalkthrough.id,
      finding: {
        area: findingForm.area,
        issue: findingForm.issue,
        severity: findingForm.severity,
        notes: findingForm.notes || undefined,
      },
      currentFindings: activeWalkthrough.findings,
    }, {
      onSuccess: () => {
        setFindingForm({ area: '', issue: '', severity: 'medium', notes: '' });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Active Walkthrough View
  if (activeWalkthrough) {
    const statusConfig = getStatusConfig(activeWalkthrough.status);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setActiveWalkthrough(null)}>
              ← Back to List
            </Button>
            <h2 className="text-xl font-semibold mt-2">{activeWalkthrough.name}</h2>
            <Badge variant={statusConfig.variant} className="mt-1">{statusConfig.label}</Badge>
          </div>
          <div className="flex gap-2">
            {activeWalkthrough.status === 'scheduled' && (
              <Button onClick={() => startWalkthrough.mutate(activeWalkthrough.id)} disabled={startWalkthrough.isPending}>
                <Play className="h-4 w-4 mr-2" />
                Start Walkthrough
              </Button>
            )}
            {activeWalkthrough.status === 'in_progress' && (
              <Button onClick={() => completeWalkthrough.mutate(activeWalkthrough.id)} disabled={completeWalkthrough.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Walkthrough
              </Button>
            )}
          </div>
        </div>

        {/* Add Finding Form (only for in_progress) */}
        {activeWalkthrough.status === 'in_progress' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log Finding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Area/Location</Label>
                  <Select value={findingForm.area} onValueChange={(v) => setFindingForm(prev => ({ ...prev, area: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                      ))}
                      <SelectItem value="Lobby">Lobby</SelectItem>
                      <SelectItem value="Hallway">Hallway</SelectItem>
                      <SelectItem value="Exterior">Exterior</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select 
                    value={findingForm.severity} 
                    onValueChange={(v) => setFindingForm(prev => ({ ...prev, severity: v as 'low' | 'medium' | 'high' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Issue Description</Label>
                <Input 
                  value={findingForm.issue} 
                  onChange={(e) => setFindingForm(prev => ({ ...prev, issue: e.target.value }))}
                  placeholder="Describe the issue found..."
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea 
                  value={findingForm.notes}
                  onChange={(e) => setFindingForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
              <Button onClick={handleAddFinding} disabled={addFinding.isPending || !findingForm.area || !findingForm.issue}>
                {addFinding.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Finding
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Findings List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Findings ({activeWalkthrough.findings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeWalkthrough.findings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No findings logged yet.</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {activeWalkthrough.findings.map((finding, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium">{finding.area}</span>
                          <p className="text-sm text-muted-foreground">{finding.issue}</p>
                          {finding.notes && <p className="text-xs text-muted-foreground mt-1">{finding.notes}</p>}
                        </div>
                        <Badge 
                          variant={finding.severity === 'high' ? 'destructive' : finding.severity === 'medium' ? 'secondary' : 'outline'}
                        >
                          {finding.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Walkthrough List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Map className="h-5 w-5 text-slate-500" />
          Venue Walkthroughs
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Walkthrough
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule New Walkthrough</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Walkthrough Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pre-Event Safety Walkthrough"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Lead Name</Label>
                <Input 
                  value={formData.lead_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                  placeholder="Who is leading?"
                />
              </div>
              <div>
                <Label>Attendees (comma-separated)</Label>
                <Input 
                  value={formData.attendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                  placeholder="John, Jane, Bob"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createWalkthrough.isPending || !formData.name.trim()}>
                {createWalkthrough.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Schedule
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Walkthroughs List */}
      <Card>
        <CardContent className="pt-6">
          {walkthroughs?.length === 0 ? (
            <div className="text-center py-12">
              <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No walkthroughs scheduled</h3>
              <p className="text-sm text-muted-foreground">Schedule a venue walkthrough to inspect the facility.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walkthroughs?.map((walkthrough) => {
                const statusConfig = getStatusConfig(walkthrough.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={walkthrough.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setActiveWalkthrough(walkthrough)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${statusConfig.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{walkthrough.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {walkthrough.scheduled_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(walkthrough.scheduled_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {walkthrough.lead_name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {walkthrough.lead_name}
                            </span>
                          )}
                          {walkthrough.findings.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {walkthrough.findings.length} findings
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
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
