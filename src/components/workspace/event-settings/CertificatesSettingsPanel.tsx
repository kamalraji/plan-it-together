import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, FileCheck, Users, Award, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCertificateTemplates, type CertificateTemplate, type CreateTemplateInput, type UpdateTemplateInput } from '@/hooks/useCertificateTemplates';
import { CertificateTemplateDesigner } from '@/components/certificates/CertificateTemplateDesigner';
import { DelegationManager } from '@/components/certificates/DelegationManager';
import { WorkspaceCertificateManagement } from '@/components/certificates/WorkspaceCertificateManagement';

interface CertificatesSettingsPanelProps {
  eventId: string;
  workspaceId: string;
  isRootOwner?: boolean;
}

export function CertificatesSettingsPanel({ 
  eventId, 
  workspaceId,
  isRootOwner = true 
}: CertificatesSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);

  const {
    templates,
    isLoading: isLoadingTemplates,
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    deleteTemplate,
    isDeleting,
  } = useCertificateTemplates(workspaceId);

  const handleCreateTemplate = (templateData: CreateTemplateInput) => {
    createTemplate(templateData, {
      onSuccess: () => {
        toast.success('Template created successfully');
        setIsDesignerOpen(false);
      },
      onError: (error) => toast.error(`Failed to create template: ${error.message}`),
    });
  };

  const handleUpdateTemplate = (templateData: UpdateTemplateInput) => {
    if (!editingTemplate) return;

    updateTemplate(
      { templateId: editingTemplate.id, template: templateData },
      {
        onSuccess: () => {
          toast.success('Template updated successfully');
          setEditingTemplate(null);
        },
        onError: (error) => toast.error(`Failed to update template: ${error.message}`),
      }
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    deleteTemplate(templateId, {
      onSuccess: () => toast.success('Template deleted'),
      onError: (error) => toast.error(`Failed to delete template: ${error.message}`),
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMPLETION':
        return 'bg-blue-100 text-blue-800';
      case 'MERIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPRECIATION':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Certificate Settings</h3>
        <p className="text-sm text-muted-foreground">
          Design templates, configure criteria, and manage certificate delegation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Criteria</span>
          </TabsTrigger>
          <TabsTrigger value="delegation" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Delegation</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Certificate Templates</h4>
              <Button onClick={() => setIsDesignerOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">No Templates Yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create certificate templates with custom branding, logos, and signatures.
                  </p>
                  <Button onClick={() => setIsDesignerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTypeColor(template.type)}>
                              {template.type}
                            </Badge>
                            {template.is_default && (
                              <Badge variant="outline">Default</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Mini Preview */}
                      <div
                        className="aspect-[1.414/1] rounded border p-4 mb-4 flex flex-col items-center justify-center text-center"
                        style={{
                          borderColor: (template.branding as any)?.primaryColor || '#e5e7eb',
                          backgroundColor: '#fefefe',
                        }}
                      >
                        {template.logo_url && (
                          <img 
                            src={template.logo_url} 
                            alt="Logo" 
                            className="h-6 w-auto mb-2"
                          />
                        )}
                        <p 
                          className="text-xs font-semibold"
                          style={{ color: (template.branding as any)?.primaryColor }}
                        >
                          {(template.content as any)?.title || 'Certificate'}
                        </p>
                        <p className="text-[8px] text-muted-foreground mt-1">
                          {template.type}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Create Template Dialog */}
            <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Certificate Template</DialogTitle>
                </DialogHeader>
                <CertificateTemplateDesigner
                  workspaceId={workspaceId}
                  onSave={(data) => handleCreateTemplate(data as CreateTemplateInput)}
                  onCancel={() => setIsDesignerOpen(false)}
                  isSaving={isCreating}
                />
              </DialogContent>
            </Dialog>

            {/* Edit Template Dialog */}
            <Dialog 
              open={!!editingTemplate} 
              onOpenChange={(open) => !open && setEditingTemplate(null)}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Certificate Template</DialogTitle>
                </DialogHeader>
                {editingTemplate && (
                  <CertificateTemplateDesigner
                    workspaceId={workspaceId}
                    template={editingTemplate}
                    onSave={(data) => handleUpdateTemplate(data as any)}
                    onCancel={() => setEditingTemplate(null)}
                    isSaving={isUpdating}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* Criteria & Overview Tab - Uses existing WorkspaceCertificateManagement */}
        <TabsContent value="criteria" className="mt-6">
          <WorkspaceCertificateManagement workspaceId={workspaceId} />
        </TabsContent>

        {/* Delegation Tab */}
        <TabsContent value="delegation" className="mt-6">
          {isRootOwner ? (
            <DelegationManager rootWorkspaceId={workspaceId} eventId={eventId} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Delegation Restricted</h4>
                <p className="text-sm text-muted-foreground">
                  Only workspace owners can manage certificate delegation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Overview Tab - Uses existing WorkspaceCertificateManagement certificates view */}
        <TabsContent value="overview" className="mt-6">
          <WorkspaceCertificateManagement workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
