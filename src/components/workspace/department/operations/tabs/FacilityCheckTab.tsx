import { useState, useMemo } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, CheckCircle2, AlertTriangle, XCircle, Clock, Plus, RefreshCw, Loader2 } from 'lucide-react';
import {
  useFacilityChecks,
  useCreateFacilityCheck,
  useUpdateFacilityCheck,
  useRecheckFacility,
  useDeleteFacilityCheck,
  FacilityCheck,
} from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';

interface FacilityCheckTabProps {
  workspace: Workspace;
}

export function FacilityCheckTab({ workspace }: FacilityCheckTabProps) {
  const { data: facilityChecks, isLoading } = useFacilityChecks(workspace.id);
  const createFacilityCheck = useCreateFacilityCheck(workspace.id);
  const updateFacilityCheck = useUpdateFacilityCheck(workspace.id);
  const recheckFacility = useRecheckFacility(workspace.id);
  const deleteFacilityCheck = useDeleteFacilityCheck(workspace.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCheck, setNewCheck] = useState({
    area: '',
    item: '',
    notes: '',
  });

  const getStatusIcon = (status: FacilityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: FacilityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Warning</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
    }
  };

  // Group checks by area
  const groupedChecks = useMemo(() => {
    if (!facilityChecks) return {};
    return facilityChecks.reduce((acc, check) => {
      if (!acc[check.area]) acc[check.area] = [];
      acc[check.area].push(check);
      return acc;
    }, {} as Record<string, FacilityCheck[]>);
  }, [facilityChecks]);

  const handleAddCheck = () => {
    if (!newCheck.area.trim() || !newCheck.item.trim()) return;
    createFacilityCheck.mutate({
      area: newCheck.area,
      item: newCheck.item,
      notes: newCheck.notes || null,
      status: 'pending',
    });
    setNewCheck({ area: '', item: '', notes: '' });
    setIsAddModalOpen(false);
  };

  const handleStatusChange = (id: string, status: FacilityCheck['status']) => {
    updateFacilityCheck.mutate({ id, status });
  };

  const handleRecheck = (id: string) => {
    recheckFacility.mutate(id);
  };

  const passedCount = facilityChecks?.filter(f => f.status === 'pass').length || 0;
  const warningCount = facilityChecks?.filter(f => f.status === 'warning').length || 0;
  const failedCount = facilityChecks?.filter(f => f.status === 'fail').length || 0;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Facility Check</h2>
          <p className="text-muted-foreground">Venue inspection and safety checks</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Check Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">{passedCount}</div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500">{warningCount}</div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">{failedCount}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Checks by Area */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Inspection Checklist</CardTitle>
          <CardDescription>Grouped by facility area</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {Object.keys(groupedChecks).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedChecks).map(([area, checks]) => (
                  <div key={area}>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">{area}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {checks.filter(c => c.status === 'pass').length}/{checks.length} passed
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {checks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {getStatusIcon(check.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-foreground truncate">{check.item}</span>
                              {getStatusBadge(check.status)}
                            </div>
                            {check.checked_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Checked: {format(new Date(check.checked_at), 'MMM d, h:mm a')}
                                {check.checked_by_name && ` by ${check.checked_by_name}`}
                              </p>
                            )}
                            {check.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{check.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={check.status}
                              onValueChange={(value) => handleStatusChange(check.id, value as FacilityCheck['status'])}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="pass">Pass</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="fail">Fail</SelectItem>
                              </SelectContent>
                            </Select>
                            {(check.status === 'fail' || check.status === 'warning') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={() => handleRecheck(check.id)}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Recheck
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive"
                              onClick={() => deleteFacilityCheck.mutate(check.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No facility checks configured</p>
                <p className="text-sm">Add check items to start inspecting facilities</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Facility Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Area *</Label>
              <Input
                placeholder="e.g., Main Hall, Lobby, Kitchen"
                value={newCheck.area}
                onChange={(e) => setNewCheck({ ...newCheck, area: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Check Item *</Label>
              <Input
                placeholder="e.g., Fire extinguishers inspected"
                value={newCheck.item}
                onChange={(e) => setNewCheck({ ...newCheck, item: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={newCheck.notes}
                onChange={(e) => setNewCheck({ ...newCheck, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCheck} disabled={createFacilityCheck.isPending}>
              {createFacilityCheck.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
