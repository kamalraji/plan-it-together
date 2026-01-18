import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Monitor, CheckCircle, XCircle, AlertTriangle, Search, Play, RotateCcw, Plus, Wrench, Loader2, Trash2, History  } from 'lucide-react';
import { useEquipment, Equipment, EquipmentTest } from '@/hooks/useEquipment';
import { format } from 'date-fns';

interface TestEquipmentTabProps {
  workspaceId: string;
}

const EQUIPMENT_TYPES = [
  { value: 'projector', label: 'Projector' },
  { value: 'audio', label: 'Audio' },
  { value: 'display', label: 'Display' },
  { value: 'computer', label: 'Computer' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'network', label: 'Network' },
  { value: 'general', label: 'General' },
];

export function TestEquipmentTab({ workspaceId }: TestEquipmentTabProps) {
  const {
    equipment,
    stats,
    teamMembers,
    isLoading,
    isSaving,
    createEquipment,
    deleteEquipment,
    runTest,
    getTestHistory,
    startTesting,
    resetAllStatuses,
    createDefaultTemplate,
  } = useEquipment({ workspaceId });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Add equipment dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    equipmentType: 'general',
    serialNumber: '',
    location: '',
    assignedToId: '',
    notes: '',
  });

  // Test equipment dialog
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testingEquipment, setTestingEquipment] = useState<Equipment | null>(null);
  const [testResult, setTestResult] = useState<'passed' | 'failed' | 'warning'>('passed');
  const [testNotes, setTestNotes] = useState('');

  // Test history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyEquipment, setHistoryEquipment] = useState<Equipment | null>(null);
  const [testHistory, setTestHistory] = useState<EquipmentTest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                          (item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'testing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><RotateCcw className="h-3 w-3 mr-1 animate-spin" />Testing</Badge>;
      case 'maintenance':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20"><Wrench className="h-3 w-3 mr-1" />Maintenance</Badge>;
    }
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim()) return;

    const assignedMember = teamMembers.find(m => m.id === newEquipment.assignedToId);
    
    await createEquipment.mutateAsync({
      name: newEquipment.name,
      equipmentType: newEquipment.equipmentType,
      serialNumber: newEquipment.serialNumber || undefined,
      location: newEquipment.location || undefined,
      assignedToId: newEquipment.assignedToId || undefined,
      assignedToName: assignedMember?.name,
      notes: newEquipment.notes || undefined,
    });

    setNewEquipment({
      name: '',
      equipmentType: 'general',
      serialNumber: '',
      location: '',
      assignedToId: '',
      notes: '',
    });
    setIsAddDialogOpen(false);
  };

  const handleOpenTestDialog = (item: Equipment) => {
    setTestingEquipment(item);
    setTestResult('passed');
    setTestNotes('');
    setIsTestDialogOpen(true);
  };

  const handleSubmitTest = async () => {
    if (!testingEquipment) return;

    await runTest(testingEquipment.id, testResult, testNotes);
    setIsTestDialogOpen(false);
    setTestingEquipment(null);
  };

  const handleOpenHistoryDialog = async (item: Equipment) => {
    setHistoryEquipment(item);
    setIsHistoryDialogOpen(true);
    setIsLoadingHistory(true);
    
    try {
      const history = await getTestHistory(item.id);
      setTestHistory(history);
    } catch (error) {
      console.error('Failed to load test history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRunAllTests = async () => {
    for (const item of equipment.filter(e => e.status === 'pending')) {
      await startTesting(item.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Test Equipment</h2>
          <p className="text-sm text-muted-foreground">Run diagnostics and verify equipment status</p>
        </div>
        <div className="flex items-center gap-2">
          {equipment.length === 0 && (
            <Button variant="outline" onClick={createDefaultTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
          <Button variant="outline" onClick={resetAllStatuses} disabled={equipment.length === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button onClick={handleRunAllTests} disabled={stats.pending === 0}>
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
                <DialogDescription>Add new equipment to the inventory for testing</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Stage Projector"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newEquipment.equipmentType}
                      onValueChange={(value) => setNewEquipment(prev => ({ ...prev, equipmentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input
                      id="serial"
                      value={newEquipment.serialNumber}
                      onChange={(e) => setNewEquipment(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="SN-12345"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newEquipment.location}
                      onChange={(e) => setNewEquipment(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Main Hall"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select
                      value={newEquipment.assignedToId}
                      onValueChange={(value) => setNewEquipment(prev => ({ ...prev, assignedToId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newEquipment.notes}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this equipment..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddEquipment} disabled={!newEquipment.name.trim() || isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Equipment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Equipment</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.testing}</div>
            <div className="text-xs text-muted-foreground">Testing</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'passed', 'failed', 'pending', 'testing', 'maintenance'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Equipment Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {equipment.length === 0 ? (
                <div className="space-y-2">
                  <p>No equipment in inventory yet.</p>
                  <Button variant="outline" size="sm" onClick={createDefaultTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Default Template
                  </Button>
                </div>
              ) : (
                <p>No equipment matches your search.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.equipmentType} • {item.location || 'No location'}
                      {item.serialNumber && ` • SN: ${item.serialNumber}`}
                      {item.lastTestedAt && ` • Last: ${format(new Date(item.lastTestedAt), 'MMM d HH:mm')}`}
                    </div>
                    {item.assignedToName && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Assigned: {item.assignedToName}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">{item.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <Button variant="ghost" size="sm" onClick={() => handleOpenHistoryDialog(item)} title="View History">
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenTestDialog(item)} title="Run Test">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEquipment.mutate(item.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Result Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Test Result</DialogTitle>
            <DialogDescription>
              {testingEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Test Result</Label>
              <div className="flex gap-2">
                <Button
                  variant={testResult === 'passed' ? 'default' : 'outline'}
                  className={testResult === 'passed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  onClick={() => setTestResult('passed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Passed
                </Button>
                <Button
                  variant={testResult === 'warning' ? 'default' : 'outline'}
                  className={testResult === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  onClick={() => setTestResult('warning')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Warning
                </Button>
                <Button
                  variant={testResult === 'failed' ? 'default' : 'outline'}
                  className={testResult === 'failed' ? 'bg-red-500 hover:bg-red-600' : ''}
                  onClick={() => setTestResult('failed')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Failed
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="testNotes">Notes</Label>
              <Textarea
                id="testNotes"
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Add notes about the test..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTest} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Test History</DialogTitle>
            <DialogDescription>
              {historyEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : testHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No test history available.
              </div>
            ) : (
              <div className="space-y-3">
                {testHistory.map((test) => (
                  <div key={test.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {test.result === 'passed' && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />Passed
                          </Badge>
                        )}
                        {test.result === 'warning' && (
                          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            <AlertTriangle className="h-3 w-3 mr-1" />Warning
                          </Badge>
                        )}
                        {test.result === 'failed' && (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                            <XCircle className="h-3 w-3 mr-1" />Failed
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(test.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {test.testedByName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Tested by: {test.testedByName}
                      </div>
                    )}
                    {test.notes && (
                      <div className="text-sm mt-2">{test.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
