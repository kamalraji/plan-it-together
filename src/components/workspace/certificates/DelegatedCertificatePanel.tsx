import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Award, Palette, FileCheck, Zap, Send } from 'lucide-react';
import { useMyDelegatedPermissions } from '@/hooks/useCertificateDelegation';
import { useCertificateTemplates } from '@/hooks/useCertificateTemplates';
import { WorkspaceCertificateManagement } from '@/components/certificates/WorkspaceCertificateManagement';
import { CertificateTemplateDesigner } from '@/components/certificates/CertificateTemplateDesigner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DelegatedCertificatePanelProps {
  workspaceId: string;
}

export function DelegatedCertificatePanel({ workspaceId }: DelegatedCertificatePanelProps) {
  const {
    delegation,
    isLoading,
    hasDelegation,
    canDesign,
    canDefineCriteria,
    canGenerate,
    canDistribute,
    rootWorkspaceId,
  } = useMyDelegatedPermissions(workspaceId);

  const [isDesignerOpen, setIsDesignerOpen] = useState(false);

  const {
    templates,
    isLoading: isLoadingTemplates,
    createTemplate,
    isCreating,
  } = useCertificateTemplates(rootWorkspaceId);

  const handleCreateTemplate = (templateData: any) => {
    createTemplate(templateData, {
      onSuccess: () => {
        toast.success('Template created successfully');
        setIsDesignerOpen(false);
      },
      onError: (error) => toast.error(`Failed to create template: ${error.message}`),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasDelegation) {
    return null; // Don't render anything if no delegation
  }

  // Determine which tabs to show based on permissions
  const availableTabs: Array<{ id: string; label: string; icon: React.ReactNode }> = [];

  if (canDesign) {
    availableTabs.push({ id: 'templates', label: 'Templates', icon: <Palette className="h-4 w-4" /> });
  }
  if (canDefineCriteria || canGenerate) {
    availableTabs.push({ id: 'criteria', label: 'Criteria & Generate', icon: <FileCheck className="h-4 w-4" /> });
  }
  if (canDistribute) {
    availableTabs.push({ id: 'distribute', label: 'Distribute', icon: <Send className="h-4 w-4" /> });
  }

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Certificate Management</CardTitle>
              <CardDescription>
                Delegated from {delegation?.rootWorkspaceName}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {canDesign && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Palette className="h-3 w-3" />
                Design
              </Badge>
            )}
            {canDefineCriteria && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                Criteria
              </Badge>
            )}
            {canGenerate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Generate
              </Badge>
            )}
            {canDistribute && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Distribute
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableTabs[0]?.id}>
          <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Templates Tab */}
          {canDesign && (
            <TabsContent value="templates" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Certificate Templates</h4>
                  <Button onClick={() => setIsDesignerOpen(true)}>
                    Create Template
                  </Button>
                </div>

                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates created yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsDesignerOpen(true)}
                    >
                      Create First Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{template.type}</Badge>
                            {template.is_default && <Badge>Default</Badge>}
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}

                <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Certificate Template</DialogTitle>
                    </DialogHeader>
                    {rootWorkspaceId && (
                      <CertificateTemplateDesigner
                        workspaceId={rootWorkspaceId}
                        onSave={handleCreateTemplate}
                        onCancel={() => setIsDesignerOpen(false)}
                        isSaving={isCreating}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          )}

          {/* Criteria & Generate Tab */}
          {(canDefineCriteria || canGenerate) && rootWorkspaceId && (
            <TabsContent value="criteria" className="mt-4">
              <WorkspaceCertificateManagement workspaceId={rootWorkspaceId} />
            </TabsContent>
          )}

          {/* Distribution Tab */}
          {canDistribute && rootWorkspaceId && (
            <TabsContent value="distribute" className="mt-4">
              <WorkspaceCertificateManagement workspaceId={rootWorkspaceId} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
