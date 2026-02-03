import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useContingency, ProcedureStep } from '@/hooks/useContingency';
import { 
  Plus, Package, Shield, Phone, Clock, CheckCircle2,
  ChevronDown, ChevronRight, Play, Trash2, RotateCcw, TestTube, Rocket
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContingencyChecklistTabProps {
  workspaceId: string;
}

const PROCEDURE_CATEGORIES = [
  { value: 'power_failure', label: 'Power Failure', icon: '⚡' },
  { value: 'network_failure', label: 'Network Failure', icon: '🌐' },
  { value: 'av_failure', label: 'AV Failure', icon: '📽' },
  { value: 'equipment_failure', label: 'Equipment Failure', icon: '🔧' },
  { value: 'weather', label: 'Weather', icon: '🌧' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'evacuation', label: 'Evacuation', icon: '🚪' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const STATUS_CONFIG = {
  ready: { color: 'bg-green-500/20 text-green-600', label: 'Ready' },
  deployed: { color: 'bg-blue-500/20 text-blue-600', label: 'Deployed' },
  in_use: { color: 'bg-purple-500/20 text-purple-600', label: 'In Use' },
  maintenance: { color: 'bg-yellow-500/20 text-yellow-600', label: 'Maintenance' },
  unavailable: { color: 'bg-gray-500/20 text-gray-600', label: 'Unavailable' },
};

export function ContingencyChecklistTab({ workspaceId }: ContingencyChecklistTabProps) {
  const { 
    backupEquipment, procedures, stats, isLoading,
    addBackupEquipment, deployBackup, returnBackup, testBackup, deleteBackupEquipment,
    createProcedure, verifyProcedure, recordDrill, deleteProcedure
  } = useContingency({ workspaceId });
  
  const [isAddBackupOpen, setIsAddBackupOpen] = useState(false);
  const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
  const [expandedProcedures, setExpandedProcedures] = useState<Set<string>>(new Set());
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [deployFor, setDeployFor] = useState('');

  // Backup form
  const [backupForm, setBackupForm] = useState({
    name: '',
    equipmentType: '',
    location: '',
    notes: '',
  });

  // Procedure form
  const [procedureForm, setProcedureForm] = useState({
    name: '',
    category: 'equipment_failure' as const,
    triggerCondition: '',
    rtoMinutes: '',
    primaryContactName: '',
    primaryContactPhone: '',
    steps: [{ step: 1, action: '', responsible: '' }] as ProcedureStep[],
  });

  const toggleProcedure = (id: string) => {
    setExpandedProcedures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddBackup = async () => {
    await addBackupEquipment({
      name: backupForm.name,
      equipmentType: backupForm.equipmentType,
      location: backupForm.location,
      notes: backupForm.notes,
    });
    setBackupForm({ name: '', equipmentType: '', location: '', notes: '' });
    setIsAddBackupOpen(false);
  };

  const handleDeploy = async (id: string) => {
    await deployBackup({ id, deployedFor: deployFor });
    setDeployingId(null);
    setDeployFor('');
  };

  const handleAddProcedure = async () => {
    await createProcedure({
      name: procedureForm.name,
      category: procedureForm.category,
      triggerCondition: procedureForm.triggerCondition,
      rtoMinutes: procedureForm.rtoMinutes ? parseInt(procedureForm.rtoMinutes) : undefined,
      primaryContactName: procedureForm.primaryContactName,
      primaryContactPhone: procedureForm.primaryContactPhone,
      procedureSteps: procedureForm.steps.filter(s => s.action),
    });
    setProcedureForm({
      name: '',
      category: 'equipment_failure',
      triggerCondition: '',
      rtoMinutes: '',
      primaryContactName: '',
      primaryContactPhone: '',
      steps: [{ step: 1, action: '', responsible: '' }],
    });
    setIsAddProcedureOpen(false);
  };

  const addStep = () => {
    setProcedureForm(prev => ({
      ...prev,
      steps: [...prev.steps, { step: prev.steps.length + 1, action: '', responsible: '' }],
    }));
  };

  const updateStep = (index: number, field: keyof ProcedureStep, value: string) => {
    setProcedureForm(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Backup & Contingency</h2>
          <p className="text-sm text-muted-foreground">Manage backup equipment and emergency procedures</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddBackupOpen} onOpenChange={setIsAddBackupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Backup</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Backup Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={backupForm.name}
                      onChange={e => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Backup Projector"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Input
                      value={backupForm.equipmentType}
                      onChange={e => setBackupForm(prev => ({ ...prev, equipmentType: e.target.value }))}
                      placeholder="Projector"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={backupForm.location}
                    onChange={e => setBackupForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Tech Room, Shelf A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={backupForm.notes}
                    onChange={e => setBackupForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any notes..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddBackupOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddBackup} disabled={!backupForm.name || !backupForm.equipmentType}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddProcedureOpen} onOpenChange={setIsAddProcedureOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Procedure</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Contingency Procedure</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={procedureForm.name}
                      onChange={e => setProcedureForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Power Failure Response"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={procedureForm.category} onValueChange={v => setProcedureForm(prev => ({ ...prev, category: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROCEDURE_CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Trigger Condition *</Label>
                  <Input
                    value={procedureForm.triggerCondition}
                    onChange={e => setProcedureForm(prev => ({ ...prev, triggerCondition: e.target.value }))}
                    placeholder="When main power is lost for more than 30 seconds"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RTO (minutes)</Label>
                    <Input
                      type="number"
                      value={procedureForm.rtoMinutes}
                      onChange={e => setProcedureForm(prev => ({ ...prev, rtoMinutes: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Contact</Label>
                    <Input
                      value={procedureForm.primaryContactName}
                      onChange={e => setProcedureForm(prev => ({ ...prev, primaryContactName: e.target.value }))}
                      placeholder="Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Procedure Steps</Label>
                  <div className="space-y-2">
                    {procedureForm.steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-sm text-muted-foreground pt-2 w-6">{step.step}.</span>
                        <Input
                          value={step.action}
                          onChange={e => updateStep(index, 'action', e.target.value)}
                          placeholder="Action to take"
                          className="flex-1"
                        />
                        <Input
                          value={step.responsible}
                          onChange={e => updateStep(index, 'responsible', e.target.value)}
                          placeholder="Who"
                          className="w-28"
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addStep}>
                      <Plus className="h-3 w-3 mr-1" /> Add Step
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddProcedureOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddProcedure} disabled={!procedureForm.name || !procedureForm.triggerCondition}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.backupReady}</p>
            <p className="text-xs text-muted-foreground">Backup Ready</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.backupDeployed}</p>
            <p className="text-xs text-muted-foreground">Deployed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.proceduresVerified}/{stats.proceduresTotal}
            </p>
            <p className="text-xs text-muted-foreground">Verified Procedures</p>
          </CardContent>
        </Card>
        <Card className={stats.needsTest > 0 ? 'border-yellow-500/30 bg-yellow-500/5' : ''}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${stats.needsTest > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
              {stats.needsTest}
            </p>
            <p className="text-xs text-muted-foreground">Needs Testing</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Equipment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Backup Equipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupEquipment.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No backup equipment registered</p>
          ) : (
            <div className="space-y-3">
              {backupEquipment.map(backup => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{backup.name}</span>
                        <Badge className={STATUS_CONFIG[backup.status].color} variant="outline">
                          {STATUS_CONFIG[backup.status].label}
                        </Badge>
                        {backup.testResult && (
                          <Badge 
                            variant="outline" 
                            className={backup.testResult === 'passed' ? 'bg-green-500/10 text-green-600' : 
                                       backup.testResult === 'failed' ? 'bg-red-500/10 text-red-600' : 
                                       'bg-yellow-500/10 text-yellow-600'}
                          >
                            {backup.testResult}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {backup.equipmentType} • {backup.location || 'No location'}
                      </p>
                      {backup.lastTestedAt && (
                        <p className="text-xs text-muted-foreground">
                          Tested {formatDistanceToNow(new Date(backup.lastTestedAt), { addSuffix: true })}
                        </p>
                      )}
                      {backup.status === 'deployed' && backup.deployedFor && (
                        <p className="text-xs text-blue-600">Replacing: {backup.deployedFor}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {backup.status === 'ready' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testBackup({ id: backup.id, result: 'passed' })}
                        >
                          <TestTube className="h-3 w-3 mr-1" /> Test
                        </Button>
                        {deployingId === backup.id ? (
                          <div className="flex gap-1">
                            <Input
                              value={deployFor}
                              onChange={e => setDeployFor(e.target.value)}
                              placeholder="Replacing..."
                              className="w-32 h-8"
                            />
                            <Button size="sm" onClick={() => handleDeploy(backup.id)}>
                              <Rocket className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => setDeployingId(backup.id)}>
                            <Rocket className="h-3 w-3 mr-1" /> Deploy
                          </Button>
                        )}
                      </>
                    )}
                    {backup.status === 'deployed' && (
                      <Button size="sm" variant="outline" onClick={() => returnBackup(backup.id)}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Return
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteBackupEquipment(backup.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contingency Procedures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Contingency Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {procedures.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No procedures defined</p>
          ) : (
            <div className="space-y-3">
              {procedures.map(procedure => {
                const category = PROCEDURE_CATEGORIES.find(c => c.value === procedure.category);
                const isExpanded = expandedProcedures.has(procedure.id);
                
                return (
                  <Card key={procedure.id}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleProcedure(procedure.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="text-lg">{category?.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{procedure.name}</span>
                                  {procedure.rtoMinutes && (
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" /> RTO: {procedure.rtoMinutes}m
                                    </Badge>
                                  )}
                                  {procedure.isVerified ? (
                                    <Badge className="bg-green-500/20 text-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-yellow-600">Not Verified</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{procedure.triggerCondition}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {/* Steps */}
                          {procedure.procedureSteps.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Steps</h4>
                              <div className="space-y-2">
                                {procedure.procedureSteps.map((step, i) => (
                                  <div key={i} className="flex gap-3 p-2 bg-muted/30 rounded">
                                    <span className="font-medium text-sm w-6">{step.step}.</span>
                                    <div className="flex-1">
                                      <p className="text-sm">{step.action}</p>
                                      {step.responsible && (
                                        <p className="text-xs text-muted-foreground">Responsible: {step.responsible}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Contacts */}
                          {procedure.primaryContactName && (
                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{procedure.primaryContactName}</p>
                                {procedure.primaryContactPhone && (
                                  <p className="text-sm text-muted-foreground">{procedure.primaryContactPhone}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {!procedure.isVerified && (
                              <Button size="sm" variant="outline" onClick={() => verifyProcedure({ id: procedure.id })}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => recordDrill(procedure.id)}>
                              <Play className="h-3 w-3 mr-1" /> Run Drill
                            </Button>
                            {procedure.lastDrillAt && (
                              <span className="text-xs text-muted-foreground self-center">
                                Last drill: {formatDistanceToNow(new Date(procedure.lastDrillAt), { addSuffix: true })}
                              </span>
                            )}
                            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => deleteProcedure(procedure.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
