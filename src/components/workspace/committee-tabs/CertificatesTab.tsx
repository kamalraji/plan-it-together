import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Settings,
  Send,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Mail,
  Loader2,
  LayoutTemplate,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { useCertificateTemplates, CertificateTemplate } from '@/hooks/useCertificateTemplates';
import { useWorkspaceCertificates } from '@/hooks/useWorkspaceCertificates';
import { CertificateDesignStudio } from '@/components/certificates/CertificateDesignStudio';
import { format } from 'date-fns';

interface CertificatesTabProps {
  workspace: Workspace;
}

export function CertificatesTab({ workspace }: CertificatesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'criteria' | 'generate' | 'distribution'>('templates');
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('Untitled Template');

  // Hooks
  const {
    templates,
    isLoading: isLoadingTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useCertificateTemplates(workspace.id);

  const {
    certificates,
    stats,
    isLoadingCertificates,
    batchGenerate,
    distribute,
    isGenerating,
    isDistributing,
  } = useWorkspaceCertificates(workspace.id);

  // Parse canvas JSON safely
  const getInitialData = (): object | undefined => {
    if (!editingTemplate?.branding?.canvasJSON) return undefined;
    const canvasJSON = editingTemplate.branding.canvasJSON;
    if (typeof canvasJSON === 'string') {
      try {
        return JSON.parse(canvasJSON);
      } catch {
        return undefined;
      }
    }
    return canvasJSON as object;
  };

  // Handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('Untitled Template');
    setShowDesignStudio(true);
  };

  const handleEditTemplate = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setShowDesignStudio(true);
  };

  const handleSaveDesign = (data: { canvasJSON: object; name: string }) => {
    const canvasJSONString = JSON.stringify(data.canvasJSON);
    if (editingTemplate) {
      updateTemplate({
        templateId: editingTemplate.id,
        template: {
          name: data.name,
          branding: { canvasJSON: canvasJSONString },
        },
      }, {
        onSuccess: () => {
          toast.success('Template updated successfully');
          setShowDesignStudio(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    } else {
      createTemplate({
        name: data.name,
        type: 'COMPLETION',
        branding: { canvasJSON: canvasJSONString },
      }, {
        onSuccess: () => {
          toast.success('Template created successfully');
          setShowDesignStudio(false);
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId, {
        onSuccess: () => toast.success('Template deleted'),
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const handleBatchGenerate = () => {
    batchGenerate(undefined, {
      onSuccess: () => {
        toast.success('Certificates generated successfully');
        setShowGenerateDialog(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDistribute = () => {
    if (selectedCertificates.length === 0) {
      toast.error('Please select certificates to distribute');
      return;
    }
    
    distribute(selectedCertificates, {
      onSuccess: () => {
        toast.success(`${selectedCertificates.length} certificates distributed`);
        setSelectedCertificates([]);
        setShowDistributeDialog(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const toggleCertificateSelection = (certId: string) => {
    setSelectedCertificates(prev =>
      prev.includes(certId)
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const selectAllCertificates = () => {
    const pending = certificates.filter(c => !c.distributedAt);
    if (selectedCertificates.length === pending.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(pending.map(c => c.id));
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Design Studio
  if (showDesignStudio) {
    return (
      <CertificateDesignStudio
        initialData={getInitialData()}
        onSave={handleSaveDesign}
        onCancel={() => setShowDesignStudio(false)}
        templateName={templateName}
        workspaceId={workspace.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-500" />
            Certificates
          </h2>
          <p className="text-muted-foreground text-sm">
            Design, generate, and distribute certificates for event attendees
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubTab === 'templates' && (
            <Button onClick={handleCreateTemplate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          )}
          {activeSubTab === 'generate' && (
            <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Certificates
            </Button>
          )}
          {activeSubTab === 'distribution' && selectedCertificates.length > 0 && (
            <Button onClick={() => setShowDistributeDialog(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Send ({selectedCertificates.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <LayoutTemplate className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FileCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Send className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.distributed ?? 0}</p>
                <p className="text-xs text-muted-foreground">Distributed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="criteria" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Criteria</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Generate</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Distribute</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first certificate template to get started
                </p>
                <Button onClick={handleCreateTemplate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.type}
                          </Badge>
                          {template.is_default && (
                            <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                              Default
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Preview placeholder */}
                    <div className="h-24 rounded-lg bg-muted/50 flex items-center justify-center mb-4 border border-dashed">
                      <Award className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add new template card */}
              <Card
                className="border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={handleCreateTemplate}
              >
                <CardContent className="h-full flex flex-col items-center justify-center py-12">
                  <Plus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground">Add Template</span>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Criteria Tab */}
        <TabsContent value="criteria" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Criteria</CardTitle>
              <CardDescription>
                Configure rules for automatic certificate assignment based on attendee qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Completion Certificate */}
              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Award className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Completion Certificate</h4>
                      <p className="text-sm text-muted-foreground">
                        Awarded to attendees who completed the event
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                  <div className="flex items-center gap-2">
                    <Checkbox id="req-attendance" defaultChecked />
                    <Label htmlFor="req-attendance">Require check-in attendance</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="req-confirmed" defaultChecked />
                    <Label htmlFor="req-confirmed">Require confirmed registration</Label>
                  </div>
                </div>
              </div>

              {/* Merit Certificate */}
              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Merit Certificate</h4>
                      <p className="text-sm text-muted-foreground">
                        Awarded based on performance or achievement
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                  <div className="space-y-2">
                    <Label>Minimum Score</Label>
                    <Input type="number" placeholder="80" defaultValue="80" />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Rank</Label>
                    <Input type="number" placeholder="10" defaultValue="10" />
                  </div>
                </div>
              </div>

              {/* Appreciation Certificate */}
              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Award className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Appreciation Certificate</h4>
                      <p className="text-sm text-muted-foreground">
                        Awarded to volunteers and staff
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="pl-12">
                  <Label>Required Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Volunteer', 'Speaker', 'Sponsor', 'Organizer'].map((role) => (
                      <Badge key={role} variant="outline" className="cursor-pointer hover:bg-muted">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Criteria</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Generate Certificates</CardTitle>
                <CardDescription>
                  Select a template and eligible attendees to generate certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Certificate Type</Label>
                  <Select defaultValue="COMPLETION">
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
                  <Label>Eligible Attendees</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">All Confirmed Attendees</span>
                      </div>
                      <Badge variant="secondary">124 eligible</Badge>
                    </div>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => setShowGenerateDialog(true)}>
                  <Sparkles className="h-4 w-4" />
                  Generate Certificates
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted/50 flex items-center justify-center border border-dashed">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a template to preview</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Generated Certificates</CardTitle>
                  <CardDescription>
                    View and distribute certificates to recipients
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCertificates ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  ))}
                </div>
              ) : filteredCertificates.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate certificates from the Generate tab first
                  </p>
                  <Button variant="outline" onClick={() => setActiveSubTab('generate')}>
                    Go to Generate
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedCertificates.length > 0 &&
                              selectedCertificates.length === certificates.filter(c => !c.distributedAt).length
                            }
                            onCheckedChange={selectAllCertificates}
                          />
                        </TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCertificates.includes(cert.id)}
                              onCheckedChange={() => toggleCertificateSelection(cert.id)}
                              disabled={!!cert.distributedAt}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cert.recipient.name}</p>
                              <p className="text-xs text-muted-foreground">{cert.recipient.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{cert.certificateId}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{cert.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(cert.issuedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {cert.distributedAt ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" asChild>
                                <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              {!cert.distributedAt && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedCertificates([cert.id]);
                                    setShowDistributeDialog(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Certificates</DialogTitle>
            <DialogDescription>
              This will generate certificates for all eligible attendees based on your criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Template:</span>
                <span className="font-medium">{templates[0]?.name || 'Default'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificate Type:</span>
                <span className="font-medium">Completion</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Eligible Attendees:</span>
                <span className="font-medium">124</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribute Dialog */}
      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Certificates</DialogTitle>
            <DialogDescription>
              Send certificates via email to the selected recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Selected certificates:</span>
                <Badge variant="secondary">{selectedCertificates.length}</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistributeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDistribute} disabled={isDistributing} className="gap-2">
              {isDistributing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Certificates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
