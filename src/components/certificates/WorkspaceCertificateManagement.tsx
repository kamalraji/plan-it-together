import { useState, useEffect } from 'react';
import { useWorkspaceCertificates, CertificateCriteria } from '@/hooks/useWorkspaceCertificates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, FileCheck, Send, Plus, Trash2, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceCertificateManagementProps {
  workspaceId: string;
}

export function WorkspaceCertificateManagement({ workspaceId }: WorkspaceCertificateManagementProps) {
  const {
    criteria,
    certificates,
    stats,
    isLoadingCriteria,
    isLoadingCertificates,
    isLoadingStats,
    saveCriteria,
    batchGenerate,
    distribute,
    isSavingCriteria,
    isGenerating,
    isDistributing,
  } = useWorkspaceCertificates(workspaceId);

  const [activeTab, setActiveTab] = useState('criteria');
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [criteriaForm, setCriteriaForm] = useState<CertificateCriteria[]>([]);

  // Initialize criteria form when data loads
  useEffect(() => {
    if (criteria && criteria.length > 0) {
      setCriteriaForm(criteria);
    } else {
      setCriteriaForm([
        {
          type: 'COMPLETION',
          conditions: {
            requiresAttendance: true,
          },
        },
      ]);
    }
  }, [criteria]);

  const addCriterion = () => {
    setCriteriaForm([
      ...criteriaForm,
      {
        type: 'MERIT',
        conditions: {},
      },
    ]);
  };

  const updateCriterion = (index: number, updates: Partial<CertificateCriteria>) => {
    const updated = [...criteriaForm];
    updated[index] = { ...updated[index], ...updates };
    setCriteriaForm(updated);
  };

  const removeCriterion = (index: number) => {
    setCriteriaForm(criteriaForm.filter((_, i) => i !== index));
  };

  const handleSaveCriteria = () => {
    saveCriteria(criteriaForm, {
      onSuccess: () => toast.success('Criteria saved successfully'),
      onError: (error) => toast.error(`Failed to save criteria: ${error.message}`),
    });
  };

  const handleBatchGenerate = () => {
    batchGenerate(undefined, {
      onSuccess: (data: any) => {
        toast.success(`Generated ${data.generatedCount} certificates`);
      },
      onError: (error) => toast.error(`Failed to generate certificates: ${error.message}`),
    });
  };

  const handleDistribute = () => {
    if (selectedCertificates.length === 0) return;
    
    distribute(selectedCertificates, {
      onSuccess: () => {
        toast.success('Certificates distributed successfully');
        setSelectedCertificates([]);
      },
      onError: (error) => toast.error(`Failed to distribute: ${error.message}`),
    });
  };

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(certificateId)
        ? prev.filter((id) => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const selectAllCertificates = () => {
    if (certificates) {
      setSelectedCertificates(certificates.map((cert) => cert.id));
    }
  };

  const clearSelection = () => {
    setSelectedCertificates([]);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.distributed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">By Type</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{stats.byType.COMPLETION} Completion</Badge>
                <Badge variant="outline">{stats.byType.MERIT} Merit</Badge>
                <Badge>{stats.byType.APPRECIATION} Appreciation</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Management</CardTitle>
          <CardDescription>
            Configure criteria, generate, and distribute certificates for your event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="criteria">Criteria</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>

            {/* Criteria Tab */}
            <TabsContent value="criteria" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Certificate Criteria Configuration</h3>
                <Button onClick={addCriterion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Criterion
                </Button>
              </div>

              {isLoadingCriteria ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {criteriaForm.map((criterion, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Criterion {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriterion(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Certificate Type</Label>
                            <Select
                              value={criterion.type}
                              onValueChange={(value) =>
                                updateCriterion(index, { type: value as CertificateCriteria['type'] })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="COMPLETION">Completion</SelectItem>
                                <SelectItem value="MERIT">Merit</SelectItem>
                                <SelectItem value="APPRECIATION">Appreciation</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Minimum Score (optional)</Label>
                            <Input
                              type="number"
                              value={criterion.conditions.minScore || ''}
                              onChange={(e) =>
                                updateCriterion(index, {
                                  conditions: {
                                    ...criterion.conditions,
                                    minScore: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                })
                              }
                              placeholder="e.g., 80"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Maximum Rank (optional)</Label>
                            <Input
                              type="number"
                              value={criterion.conditions.maxRank || ''}
                              onChange={(e) =>
                                updateCriterion(index, {
                                  conditions: {
                                    ...criterion.conditions,
                                    maxRank: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                })
                              }
                              placeholder="e.g., 3"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`attendance-${index}`}
                              checked={criterion.conditions.requiresAttendance || false}
                              onCheckedChange={(checked) =>
                                updateCriterion(index, {
                                  conditions: {
                                    ...criterion.conditions,
                                    requiresAttendance: !!checked,
                                  },
                                })
                              }
                            />
                            <Label htmlFor={`attendance-${index}`}>Requires Attendance</Label>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label>Required Roles (optional)</Label>
                          <div className="flex flex-wrap gap-2">
                            {['PARTICIPANT', 'JUDGE', 'VOLUNTEER', 'SPEAKER'].map((role) => (
                              <label key={role} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={criterion.conditions.requiresRole?.includes(role) || false}
                                  onCheckedChange={(checked) => {
                                    const currentRoles = criterion.conditions.requiresRole || [];
                                    const updatedRoles = checked
                                      ? [...currentRoles, role]
                                      : currentRoles.filter((r) => r !== role);
                                    updateCriterion(index, {
                                      conditions: {
                                        ...criterion.conditions,
                                        requiresRole: updatedRoles.length > 0 ? updatedRoles : undefined,
                                      },
                                    });
                                  }}
                                />
                                <span className="text-sm">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveCriteria} disabled={isSavingCriteria}>
                      {isSavingCriteria && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Criteria
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Generated Certificates</h3>
                <Button onClick={handleBatchGenerate} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Batch Generate
                </Button>
              </div>

              {isLoadingCertificates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : certificates.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      {selectedCertificates.length} of {certificates.length} selected
                    </span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={selectAllCertificates}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDistribute}
                        disabled={selectedCertificates.length === 0 || isDistributing}
                      >
                        {isDistributing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Send className="h-4 w-4 mr-2" />
                        Distribute Selected
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Select</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Recipient</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Certificate ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Issued</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {certificates.map((cert) => (
                          <tr key={cert.id}>
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedCertificates.includes(cert.id)}
                                onCheckedChange={() => toggleCertificateSelection(cert.id)}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{cert.recipient.name}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  cert.type === 'MERIT'
                                    ? 'default'
                                    : cert.type === 'COMPLETION'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {cert.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">{cert.certificateId}</td>
                            <td className="px-4 py-3">
                              {cert.distributedAt ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Distributed
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(cert.issuedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Certificates Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure your criteria and click "Batch Generate" to create certificates.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-4">
              <div className="text-center py-12">
                <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Distribution Status</h3>
                <p className="text-muted-foreground">
                  {stats ? (
                    <>
                      {stats.distributed} of {stats.total} certificates have been distributed.
                    </>
                  ) : (
                    'Loading distribution status...'
                  )}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
