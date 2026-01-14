import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Plus, 
  Printer, 
  Download, 
  Users,
  FileText,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Workspace } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IDCardDesignStudio } from '@/components/id-cards/IDCardDesignStudio';
import { IDCardPreview } from '@/components/id-cards/IDCardPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface IDCardsTabProps {
  workspace: Workspace;
}

interface IDCardTemplate {
  id: string;
  name: string;
  card_type: string;
  design: Record<string, unknown>;
  dimensions: { width: number; height: number; unit: string };
  is_default: boolean;
  created_at: string;
}

const cardTypeColors: Record<string, string> = {
  attendee: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  vip: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  staff: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  speaker: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  volunteer: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
};

export function IDCardsTab({ workspace }: IDCardsTabProps) {
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IDCardTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<IDCardTemplate | null>(null);

  // Fetch templates for this workspace
  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['id-card-templates', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('id_card_templates')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        card_type: t.card_type || 'attendee',
        design: t.design as Record<string, unknown>,
        dimensions: (t.dimensions as { width: number; height: number; unit: string }) || { width: 85.6, height: 53.98, unit: 'mm' },
        is_default: t.is_default || false,
        created_at: t.created_at || '',
      })) as IDCardTemplate[];
    },
  });

  // Fetch attendee stats
  const { data: attendeeStats } = useQuery({
    queryKey: ['attendee-stats', workspace.eventId],
    queryFn: async () => {
      if (!workspace.eventId) return { total: 0, checkedIn: 0 };
      
      const { count: total } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', workspace.eventId);
      
      const { count: checkedIn } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', workspace.eventId);
      
      return { total: total || 0, checkedIn: checkedIn || 0 };
    },
    enabled: !!workspace.eventId,
  });

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowDesigner(true);
  };

  const handleEditTemplate = (template: IDCardTemplate) => {
    setSelectedTemplate(template);
    setShowDesigner(true);
  };

  const handlePreviewTemplate = (template: IDCardTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('id_card_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      toast.error('Failed to delete template');
      return;
    }
    
    toast.success('Template deleted');
    refetch();
  };

  const handleDesignerClose = () => {
    setShowDesigner(false);
    setSelectedTemplate(null);
    refetch();
  };

  const handleSaveTemplate = async (data: { canvasJSON: object; name: string }) => {
    try {
      const designJson = JSON.parse(JSON.stringify(data.canvasJSON));
      
      if (selectedTemplate?.id) {
        // Update existing template
        const { error } = await supabase
          .from('id_card_templates')
          .update({
            name: data.name,
            design: designJson,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('id_card_templates')
          .insert([{
            workspace_id: workspace.id,
            event_id: workspace.eventId || '',
            name: data.name,
            design: designJson,
            card_type: 'attendee',
          }]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      handleDesignerClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-500" />
            ID Cards & Badges
          </h2>
          <p className="text-muted-foreground mt-1">
            Design, generate, and print attendee ID cards
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendeeStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CheckCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendeeStats?.checkedIn || 0}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(attendeeStats?.total || 0) - (attendeeStats?.checkedIn || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Printer className="h-4 w-4" />
            Generate & Print
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
              ))}
            </div>
          ) : templates?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first ID card template to get started
                </p>
                <Button onClick={handleCreateTemplate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((template) => (
                <Card key={template.id} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {template.dimensions.width}mm × {template.dimensions.height}mm
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cardTypeColors[template.card_type] || cardTypeColors.attendee}
                      >
                        {template.card_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Template Preview Placeholder */}
                    <div className="aspect-[1.59] bg-muted/50 rounded-lg mb-4 flex items-center justify-center border border-border/50">
                      <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {template.is_default && (
                      <Badge variant="secondary" className="mt-2 w-full justify-center">
                        Default Template
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Batch Generate ID Cards</CardTitle>
              <CardDescription>
                Select attendees and generate ID cards for printing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Create a template first before generating ID cards
                  </p>
                  <Button onClick={handleCreateTemplate} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Select a template and attendee group to generate ID cards in batch.
                      Cards can be downloaded as PDF for printing.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <Printer className="h-4 w-4" />
                      Generate All Cards
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full-screen Design Studio */}
      {showDesigner && (
        <IDCardDesignStudio
          initialData={selectedTemplate?.design?.canvasJSON as object | undefined}
          onSave={handleSaveTemplate}
          onCancel={() => setShowDesigner(false)}
          templateName={selectedTemplate?.name || 'New ID Card Template'}
          workspaceId={workspace.id}
          eventId={workspace.eventId || ''}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <IDCardPreview 
              template={previewTemplate}
              sampleData={{
                name: 'John Doe',
                role: 'Attendee',
                organization: 'Tech Corp',
                ticketType: 'VIP Pass',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
