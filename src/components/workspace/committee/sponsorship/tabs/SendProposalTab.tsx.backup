import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Workspace } from '@/types';
import { 
  useProposals, 
  useCreateProposal, 
  useUpdateProposal,
  useMoveProposalStage,
  useConvertProposalToSponsor,
  SponsorProposal,
} from '@/hooks/useSponsorshipCommitteeData';
import { 
  Plus, 
  ArrowRight,
  Building2, 
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  MoreVertical,
  Edit,
  UserPlus,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleDropdown, SimpleDropdownTrigger, SimpleDropdownContent, SimpleDropdownItem } from '@/components/ui/simple-dropdown';
import { format, formatDistanceToNow } from 'date-fns';

interface SendProposalTabProps {
  workspace: Workspace;
}

const stages = [
  { id: 'lead', label: 'Lead', icon: Building2, color: 'bg-gray-500' },
  { id: 'contacted', label: 'Contacted', icon: Send, color: 'bg-blue-500' },
  { id: 'proposal_sent', label: 'Proposal Sent', icon: ArrowRight, color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negotiation', icon: Clock, color: 'bg-amber-500' },
  { id: 'closed_won', label: 'Won', icon: CheckCircle2, color: 'bg-emerald-500' },
  { id: 'closed_lost', label: 'Lost', icon: XCircle, color: 'bg-red-500' },
];

const tierColors: Record<string, string> = {
  platinum: 'bg-slate-200 text-slate-800',
  gold: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-800',
  bronze: 'bg-orange-100 text-orange-800',
};

export function SendProposalTab({ workspace }: SendProposalTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<SponsorProposal | null>(null);

  const { data: proposals = [] } = useProposals(workspace.id);
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const moveProposalStage = useMoveProposalStage();
  const convertToSponsor = useConvertProposalToSponsor();

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    proposed_tier: 'silver',
    proposed_value: '',
    notes: '',
    next_follow_up_date: '',
  });

  const getProposalsByStage = (stageId: string) => 
    proposals.filter(p => p.stage === stageId);

  const getStageValue = (stageId: string) => 
    getProposalsByStage(stageId).reduce((sum, p) => sum + (p.proposed_value || 0), 0);

  const handleCreateProposal = () => {
    createProposal.mutate({
      workspace_id: workspace.id,
      company_name: formData.company_name,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      proposed_tier: formData.proposed_tier,
      proposed_value: parseFloat(formData.proposed_value) || 0,
      notes: formData.notes || null,
      next_follow_up_date: formData.next_follow_up_date || null,
      stage: 'lead',
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateProposal = () => {
    if (!editingProposal) return;
    updateProposal.mutate({
      id: editingProposal.id,
      workspaceId: workspace.id,
      company_name: formData.company_name,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      proposed_tier: formData.proposed_tier,
      proposed_value: parseFloat(formData.proposed_value) || 0,
      notes: formData.notes || null,
      next_follow_up_date: formData.next_follow_up_date || null,
    }, {
      onSuccess: () => {
        setEditingProposal(null);
        resetForm();
      }
    });
  };

  const handleMoveStage = (proposalId: string, newStage: string) => {
    moveProposalStage.mutate({
      id: proposalId,
      workspaceId: workspace.id,
      stage: newStage,
    });
  };

  const handleConvertToSponsor = (proposal: SponsorProposal) => {
    if (confirm(`Convert "${proposal.company_name}" to an active sponsor?`)) {
      convertToSponsor.mutate({ proposal, workspaceId: workspace.id });
    }
  };

  const openEditDialog = (proposal: SponsorProposal) => {
    setFormData({
      company_name: proposal.company_name,
      contact_name: proposal.contact_name || '',
      contact_email: proposal.contact_email || '',
      contact_phone: proposal.contact_phone || '',
      proposed_tier: proposal.proposed_tier,
      proposed_value: proposal.proposed_value?.toString() || '',
      notes: proposal.notes || '',
      next_follow_up_date: proposal.next_follow_up_date || '',
    });
    setEditingProposal(proposal);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      proposed_tier: 'silver',
      proposed_value: '',
      notes: '',
      next_follow_up_date: '',
    });
  };

  const ProposalForm = () => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
          placeholder="Acme Corp"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            placeholder="john@acme.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="proposed_tier">Proposed Tier</Label>
          <Select value={formData.proposed_tier} onValueChange={(v) => setFormData(prev => ({ ...prev, proposed_tier: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposed_value">Proposed Value ($)</Label>
          <Input
            id="proposed_value"
            type="number"
            value={formData.proposed_value}
            onChange={(e) => setFormData(prev => ({ ...prev, proposed_value: e.target.value }))}
            placeholder="10000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next_follow_up_date">Next Follow-up Date</Label>
        <Input
          id="next_follow_up_date"
          type="date"
          value={formData.next_follow_up_date}
          onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up_date: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this proposal..."
          rows={3}
        />
      </div>
    </div>
  );

  // Calculate totals
  const pipelineTotal = proposals
    .filter(p => !['closed_won', 'closed_lost'].includes(p.stage))
    .reduce((sum, p) => sum + (p.proposed_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Proposal Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            {proposals.filter(p => !['closed_won', 'closed_lost'].includes(p.stage)).length} active proposals • 
            ${pipelineTotal.toLocaleString()} potential value
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Proposal</DialogTitle>
            </DialogHeader>
            <ProposalForm />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateProposal} disabled={!formData.company_name || createProposal.isPending}>
                {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Kanban */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {stages.filter(s => !['closed_won', 'closed_lost'].includes(s.id)).map((stage) => {
            const stageProposals = getProposalsByStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const StageIcon = stage.icon;

            return (
              <Card key={stage.id} className="w-[300px] flex-shrink-0">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded', stage.color)}>
                        <StageIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {stageProposals.length}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      ${stageValue.toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 px-2">
                      {stageProposals.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          No proposals
                        </div>
                      ) : (
                        stageProposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm text-foreground line-clamp-1">
                                {proposal.company_name}
                              </h4>
                              <SimpleDropdown>
                                <SimpleDropdownTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground -mt-1 -mr-1">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </SimpleDropdownTrigger>
                                <SimpleDropdownContent align="end">
                                  <SimpleDropdownItem onClick={() => openEditDialog(proposal)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </SimpleDropdownItem>
                                  {stages
                                    .filter(s => s.id !== proposal.stage && s.id !== 'closed_lost')
                                    .map(s => (
                                      <SimpleDropdownItem key={s.id} onClick={() => handleMoveStage(proposal.id, s.id)}>
                                        <ArrowRight className="h-4 w-4 mr-2" /> Move to {s.label}
                                      </SimpleDropdownItem>
                                    ))}
                                  {proposal.stage === 'negotiation' && (
                                    <SimpleDropdownItem onClick={() => handleConvertToSponsor(proposal)}>
                                      <UserPlus className="h-4 w-4 mr-2" /> Convert to Sponsor
                                    </SimpleDropdownItem>
                                  )}
                                  <SimpleDropdownItem onClick={() => handleMoveStage(proposal.id, 'closed_lost')} className="text-destructive">
                                    <XCircle className="h-4 w-4 mr-2" /> Mark as Lost
                                  </SimpleDropdownItem>
                                </SimpleDropdownContent>
                              </SimpleDropdown>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={cn('text-xs capitalize', tierColors[proposal.proposed_tier])}>
                                {proposal.proposed_tier}
                              </Badge>
                              <span className="text-xs font-medium text-emerald-600">
                                ${(proposal.proposed_value || 0).toLocaleString()}
                              </span>
                            </div>
                            {proposal.contact_name && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {proposal.contact_name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(proposal.stage_entered_at), { addSuffix: true })}
                              </span>
                            </div>
                            {proposal.next_follow_up_date && (
                              <div className="flex items-center gap-2 text-xs text-amber-600 mt-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>Follow-up: {format(new Date(proposal.next_follow_up_date), 'MMM d')}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Closed Deals Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm">Won ({getProposalsByStage('closed_won').length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-emerald-600">
              ${getStageValue('closed_won').toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm">Lost ({getProposalsByStage('closed_lost').length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-red-600">
              ${getStageValue('closed_lost').toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProposal} onOpenChange={(open) => !open && setEditingProposal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Proposal</DialogTitle>
          </DialogHeader>
          <ProposalForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateProposal} disabled={!formData.company_name || updateProposal.isPending}>
              {updateProposal.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
