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
  useCommunications, 
  useSponsors,
  useCreateCommunication, 
  useUpdateCommunication,
  useSendCommunication,
  SponsorCommunication,
} from '@/hooks/useSponsorshipCommitteeData';
import { 
  Plus, 
  Search,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Send,
  MoreVertical,
  Edit,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleDropdown, SimpleDropdownTrigger, SimpleDropdownContent, SimpleDropdownItem } from '@/components/ui/simple-dropdown';
import { format, formatDistanceToNow } from 'date-fns';

interface SponsorCommunicationsTabProps {
  workspace: Workspace;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  email: { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Email' },
  call: { icon: Phone, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Call' },
  meeting: { icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Meeting' },
  message: { icon: MessageSquare, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Message' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Draft' },
  sent: { color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', label: 'Sent' },
  received: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Received' },
  scheduled: { color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Scheduled' },
};

export function SponsorCommunicationsTab({ workspace }: SponsorCommunicationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sponsorFilter, setSponsorFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCommunication, setEditingCommunication] = useState<SponsorCommunication | null>(null);

  const { data: communications = [], isLoading } = useCommunications(workspace.id);
  const { data: sponsors = [] } = useSponsors(workspace.id);
  const createCommunication = useCreateCommunication();
  const updateCommunication = useUpdateCommunication();
  const sendCommunication = useSendCommunication();

  const [formData, setFormData] = useState({
    sponsor_id: '',
    type: 'email',
    subject: '',
    content: '',
    direction: 'outbound',
    recipient_email: '',
  });

  const filteredCommunications = communications.filter((c) => {
    const matchesSearch = c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.sponsor as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesSponsor = sponsorFilter === 'all' || c.sponsor_id === sponsorFilter;
    return matchesSearch && matchesType && matchesSponsor;
  });

  const recentCommunications = filteredCommunications.slice(0, 20);
  const draftCommunications = communications.filter(c => c.status === 'draft');
  const scheduledCommunications = communications.filter(c => c.status === 'scheduled');

  const handleCreateCommunication = () => {
    createCommunication.mutate({
      workspace_id: workspace.id,
      sponsor_id: formData.sponsor_id,
      type: formData.type,
      subject: formData.subject,
      content: formData.content || null,
      direction: formData.direction,
      status: 'draft',
      recipient_email: formData.recipient_email || null,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateCommunication = () => {
    if (!editingCommunication) return;
    updateCommunication.mutate({
      id: editingCommunication.id,
      workspaceId: workspace.id,
      subject: formData.subject,
      content: formData.content || null,
      recipient_email: formData.recipient_email || null,
    }, {
      onSuccess: () => {
        setEditingCommunication(null);
        resetForm();
      }
    });
  };

  const handleSend = (id: string) => {
    sendCommunication.mutate({ id, workspaceId: workspace.id });
  };

  const openEditDialog = (comm: SponsorCommunication) => {
    setFormData({
      sponsor_id: comm.sponsor_id,
      type: comm.type,
      subject: comm.subject,
      content: comm.content || '',
      direction: comm.direction,
      recipient_email: comm.recipient_email || '',
    });
    setEditingCommunication(comm);
  };

  const resetForm = () => {
    setFormData({
      sponsor_id: '',
      type: 'email',
      subject: '',
      content: '',
      direction: 'outbound',
      recipient_email: '',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const CommunicationForm = () => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sponsor_id">Sponsor *</Label>
          <Select value={formData.sponsor_id} onValueChange={(v) => {
            const sponsor = sponsors.find(s => s.id === v);
            setFormData(prev => ({ 
              ...prev, 
              sponsor_id: v,
              recipient_email: sponsor?.contact_email || prev.recipient_email,
            }));
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select sponsor" />
            </SelectTrigger>
            <SelectContent>
              {sponsors.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="message">Message</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select value={formData.direction} onValueChange={(v) => setFormData(prev => ({ ...prev, direction: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">Outbound (Sent)</SelectItem>
              <SelectItem value="inbound">Inbound (Received)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.type === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="recipient_email">Recipient Email</Label>
            <Input
              id="recipient_email"
              type="email"
              value={formData.recipient_email}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
              placeholder="john@acme.com"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Follow-up on sponsorship proposal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Communication content or notes..."
          rows={5}
        />
      </div>
    </div>
  );

  const CommunicationItem = ({ comm }: { comm: SponsorCommunication }) => {
    const config = typeConfig[comm.type] || typeConfig.email;
    const status = statusConfig[comm.status] || statusConfig.draft;
    const TypeIcon = config.icon;

    return (
      <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
        <div className={cn('p-2.5 rounded-lg mt-0.5', config.bgColor)}>
          <TypeIcon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground line-clamp-1">{comm.subject}</h4>
              {comm.direction === 'inbound' ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(comm.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {(comm.sponsor as any)?.name || 'Unknown sponsor'}
          </p>
          {comm.content && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-2">
              {comm.content}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-xs', status.bgColor, status.color)}>
              {status.label}
            </Badge>
            {comm.sent_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Sent {formatDistanceToNow(new Date(comm.sent_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <SimpleDropdown>
          <SimpleDropdownTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
            <MoreVertical className="h-4 w-4" />
          </SimpleDropdownTrigger>
          <SimpleDropdownContent align="end">
            <SimpleDropdownItem onClick={() => openEditDialog(comm)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </SimpleDropdownItem>
            {comm.status === 'draft' && (
              <SimpleDropdownItem onClick={() => handleSend(comm.id)}>
                <Send className="h-4 w-4 mr-2" /> Mark as Sent
              </SimpleDropdownItem>
            )}
          </SimpleDropdownContent>
        </SimpleDropdown>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{communications.length}</p>
                <p className="text-xs text-muted-foreground">Total Communications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gray-500/10">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{draftCommunications.length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {communications.filter(c => c.status === 'sent').length}
                </p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{scheduledCommunications.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">Communication Log</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} disabled={sponsors.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Log Communication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Log New Communication</DialogTitle>
              </DialogHeader>
              <CommunicationForm />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateCommunication} 
                  disabled={!formData.subject || !formData.sponsor_id || createCommunication.isPending}
                >
                  {createCommunication.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="message">Message</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sponsorFilter} onValueChange={setSponsorFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sponsor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sponsors</SelectItem>
                {sponsors.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Communications List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : recentCommunications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p>No communications found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCommunications.map((comm) => (
                  <CommunicationItem key={comm.id} comm={comm} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCommunication} onOpenChange={(open) => !open && setEditingCommunication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Communication</DialogTitle>
          </DialogHeader>
          <CommunicationForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateCommunication} disabled={!formData.subject || updateCommunication.isPending}>
              {updateCommunication.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
