import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
  Clock,
  History,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Workspace } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IDCardDesignStudio } from '@/components/id-cards/IDCardDesignStudio';
import { IDCardPreview } from '@/components/id-cards/IDCardPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useIDCardGeneration, AttendeeForCard } from '@/hooks/useIDCardGeneration';
import { generateIDCardsPDF, downloadPDF } from '@/lib/id-card-pdf-generator';
import { AttendeeSelectionModal } from '@/components/id-cards/AttendeeSelectionModal';
import { CardGenerationProgress } from '@/components/id-cards/CardGenerationProgress';
import { format } from 'date-fns';

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
  const [showAttendeeSelection, setShowAttendeeSelection] = useState(false);
  const [showGenerationProgress, setShowGenerationProgress] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  // Generation form state
  const [generateTemplateId, setGenerateTemplateId] = useState<string>('');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'confirmed' | 'checked_in' | 'not_checked_in'>('all');
  const [selectedTicketType, setSelectedTicketType] = useState<string>('all');
  const [cardsPerPage, setCardsPerPage] = useState<1 | 2 | 4 | 8 | 9>(4);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [includeCutMarks, setIncludeCutMarks] = useState(true);
  const [manuallySelectedAttendees, setManuallySelectedAttendees] = useState<AttendeeForCard[]>([]);
  const [selectionMode, setSelectionMode] = useState<'filter' | 'manual'>('filter');

  // Use the ID card generation hook
  const {
    attendees,
    printJobs,
    stats,
    isLoadingJobs,
    generationProgress,
    setGenerationProgress,
    isGenerating,
    filterAttendees,
    createPrintJob,
    updatePrintJob,
    deletePrintJob,
  } = useIDCardGeneration(workspace.id, workspace.eventId);

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

  // Fetch event data for card generation
  const { data: eventData } = useQuery({
    queryKey: ['event-for-cards', workspace.eventId],
    queryFn: async () => {
      if (!workspace.eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('name, start_date')
        .eq('id', workspace.eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? { name: data.name, date: format(new Date(data.start_date), 'PPP') } : null;
    },
    enabled: !!workspace.eventId,
  });

  // Get filtered attendees based on current selection
  const getFilteredAttendees = (): AttendeeForCard[] => {
    if (selectionMode === 'manual') {
      return manuallySelectedAttendees;
    }

    let filtered = filterAttendees(attendees, {
      status: attendeeFilter,
      ticketTierId: selectedTicketType !== 'all' ? selectedTicketType : undefined,
    });

    return filtered;
  };

  const filteredAttendeesCount = getFilteredAttendees().length;

  // Get unique ticket types for filter dropdown
  const ticketTypes = Object.keys(stats.byTicketType);

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

  const handleGenerateCards = async () => {
    if (!generateTemplateId) {
      toast.error('Please select a template');
      return;
    }

    const attendeesToGenerate = getFilteredAttendees();
    if (attendeesToGenerate.length === 0) {
      toast.error('No attendees match the selected criteria');
      return;
    }

    const template = templates?.find(t => t.id === generateTemplateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }

    setShowGenerationProgress(true);
    setGeneratedPdfBlob(null);

    try {
      // Create a print job record
      const printJob = await createPrintJob({
        name: `${template.name} - ${format(new Date(), 'PPp')}`,
        templateId: generateTemplateId,
        totalCards: attendeesToGenerate.length,
        attendeeFilter: selectionMode === 'filter' ? { status: attendeeFilter, ticketTierId: selectedTicketType !== 'all' ? selectedTicketType : undefined } : undefined,
        attendeeIds: selectionMode === 'manual' ? manuallySelectedAttendees.map(a => a.id) : undefined,
      });

      // Generate PDF
      const pdfBlob = await generateIDCardsPDF(
        template.design as any,
        attendeesToGenerate,
        {
          cardsPerPage,
          pageSize,
          includeCutMarks,
        },
        eventData || undefined,
        setGenerationProgress
      );

      setGeneratedPdfBlob(pdfBlob);

      // Update print job status
      await updatePrintJob({
        jobId: printJob.id,
        status: 'completed',
        generatedCards: attendeesToGenerate.length,
      });

      toast.success(`Generated ${attendeesToGenerate.length} ID cards successfully!`);
    } catch (error) {
      console.error('Failed to generate cards:', error);
      setGenerationProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: 'Failed to generate cards. Please try again.',
      });
      toast.error('Failed to generate cards');
    }
  };

  const handleDownloadPdf = () => {
    if (generatedPdfBlob) {
      const template = templates?.find(t => t.id === generateTemplateId);
      const filename = `ID_Cards_${template?.name || 'export'}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
      downloadPDF(generatedPdfBlob, filename);
    }
  };

  const handleCancelGeneration = () => {
    setGenerationProgress({ current: 0, total: 0, status: 'idle' });
    setShowGenerationProgress(false);
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
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.checkedIn}</p>
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
                <p className="text-2xl font-bold">{stats.notCheckedIn}</p>
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
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Print History
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
                Select a template and attendees to generate printable ID cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Template & Layout Options */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-select">Template</Label>
                        <Select value={generateTemplateId} onValueChange={setGenerateTemplateId}>
                          <SelectTrigger id="template-select">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} ({template.card_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cards-per-page">Cards Per Page</Label>
                        <Select value={String(cardsPerPage)} onValueChange={(v) => setCardsPerPage(Number(v) as any)}>
                          <SelectTrigger id="cards-per-page">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 card per page</SelectItem>
                            <SelectItem value="2">2 cards per page</SelectItem>
                            <SelectItem value="4">4 cards per page</SelectItem>
                            <SelectItem value="8">8 cards per page</SelectItem>
                            <SelectItem value="9">9 cards per page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Page Size</Label>
                        <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as 'a4' | 'letter')} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="a4" id="a4" />
                            <Label htmlFor="a4" className="font-normal">A4</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="letter" id="letter" />
                            <Label htmlFor="letter" className="font-normal">Letter</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cut-marks" 
                          checked={includeCutMarks}
                          onCheckedChange={(checked) => setIncludeCutMarks(checked === true)}
                        />
                        <Label htmlFor="cut-marks" className="font-normal">Include cut marks</Label>
                      </div>
                    </div>

                    {/* Right Column: Attendee Selection */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Attendee Selection</Label>
                        <RadioGroup value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'filter' | 'manual')} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="filter" id="filter-mode" />
                            <Label htmlFor="filter-mode" className="font-normal">Filter by criteria</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual-mode" />
                            <Label htmlFor="manual-mode" className="font-normal">Select specific attendees</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {selectionMode === 'filter' ? (
                        <>
                          <div className="space-y-2">
                            <Label>Status Filter</Label>
                            <RadioGroup value={attendeeFilter} onValueChange={(v) => setAttendeeFilter(v as any)} className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="all-attendees" />
                                <Label htmlFor="all-attendees" className="font-normal">All ({stats.total})</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="confirmed" id="confirmed-attendees" />
                                <Label htmlFor="confirmed-attendees" className="font-normal">Confirmed ({stats.confirmed})</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="checked_in" id="checked-in-attendees" />
                                <Label htmlFor="checked-in-attendees" className="font-normal">Checked In ({stats.checkedIn})</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="not_checked_in" id="not-checked-in-attendees" />
                                <Label htmlFor="not-checked-in-attendees" className="font-normal">Not Checked In ({stats.notCheckedIn})</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {ticketTypes.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="ticket-type">Ticket Type</Label>
                              <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                                <SelectTrigger id="ticket-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Types</SelectItem>
                                  {ticketTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type} ({stats.byTicketType[type]})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAttendeeSelection(true)}
                            className="w-full gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Select Attendees ({manuallySelectedAttendees.length} selected)
                          </Button>
                        </div>
                      )}

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Cards to generate:</span>
                          <span className="font-semibold">{filteredAttendeesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      onClick={handleGenerateCards} 
                      disabled={!generateTemplateId || filteredAttendeesCount === 0 || isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                      Generate {filteredAttendeesCount} Cards
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Print Job History
              </CardTitle>
              <CardDescription>
                View and re-download previous print jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : printJobs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No print jobs yet</p>
                  <p className="text-sm text-muted-foreground">Generate some ID cards to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {printJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          job.status === 'completed' ? 'bg-emerald-500/10' :
                          job.status === 'failed' ? 'bg-red-500/10' :
                          'bg-amber-500/10'
                        }`}>
                          {job.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : job.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{job.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{job.template_name}</span>
                            <span>•</span>
                            <span>{job.total_cards} cards</span>
                            <span>•</span>
                            <span>{format(new Date(job.created_at), 'PPp')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'completed' && job.pdf_url && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deletePrintJob(job.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
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

      {/* Attendee Selection Modal */}
      <AttendeeSelectionModal
        open={showAttendeeSelection}
        onOpenChange={setShowAttendeeSelection}
        attendees={attendees}
        selectedIds={manuallySelectedAttendees.map(a => a.id)}
        onSelectionChange={(ids) => setManuallySelectedAttendees(attendees.filter(a => ids.includes(a.id)))}
        ticketTypes={templates?.map(t => t.name) || []}
      />

      {/* Generation Progress */}
      <CardGenerationProgress
        open={showGenerationProgress}
        onOpenChange={setShowGenerationProgress}
        progress={generationProgress}
        onCancel={handleCancelGeneration}
        onDownload={handleDownloadPdf}
      />
    </div>
  );
}
