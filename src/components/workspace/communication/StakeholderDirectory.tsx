import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Building2, Star, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  useWorkspaceStakeholders, 
  Stakeholder, 
  StakeholderCategory, 
  StakeholderPriority,
  CreateStakeholderInput 
} from '@/hooks/useWorkspaceStakeholders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StakeholderDirectoryProps {
  workspaceId?: string;
}

const categoryConfig: Record<StakeholderCategory, { color: string; bgColor: string; label: string }> = {
  vip: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'VIP' },
  media: { color: 'text-info', bgColor: 'bg-info/10', label: 'Media' },
  sponsor: { color: 'text-warning', bgColor: 'bg-warning/10', label: 'Sponsor' },
  partner: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Partner' },
  government: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Gov' },
};

const priorityColors: Record<StakeholderPriority, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

const defaultFormData: CreateStakeholderInput = {
  name: '',
  role: '',
  organization: '',
  email: '',
  phone: '',
  category: 'partner',
  priority: 'medium',
  notes: '',
};

export function StakeholderDirectory({ workspaceId }: StakeholderDirectoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<CreateStakeholderInput>(defaultFormData);

  const {
    stakeholders,
    isLoading,
    createStakeholder,
    deleteStakeholder,
    isCreating,
    totalCount,
  } = useWorkspaceStakeholders(workspaceId);

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return;
    createStakeholder(formData);
    setFormData(defaultFormData);
    setShowAddDialog(false);
  };

  const handleInputChange = (field: keyof CreateStakeholderInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Key Stakeholders
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalCount}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No stakeholders added yet.</p>
              <p className="text-xs mt-1">Add key contacts like sponsors, media, and VIPs.</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-[600px]">
                {stakeholders.map((stakeholder) => (
                  <StakeholderCard
                    key={stakeholder.id}
                    stakeholder={stakeholder}
                    onDelete={() => deleteStakeholder(stakeholder.id)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add Stakeholder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., CEO, Editor"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Company or organization"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 555-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleInputChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => handleInputChange('priority', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this stakeholder..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || !formData.email || isCreating}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Stakeholder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface StakeholderCardProps {
  stakeholder: Stakeholder;
  onDelete: () => void;
}

function StakeholderCard({ stakeholder, onDelete }: StakeholderCardProps) {
  const config = categoryConfig[stakeholder.category];
  const initials = stakeholder.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarFallback className={`${config.bgColor} ${config.color} text-sm font-medium`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-foreground truncate">{stakeholder.name}</p>
          {stakeholder.priority === 'high' && (
            <Star className={`h-3.5 w-3.5 ${priorityColors[stakeholder.priority]} fill-current`} />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{stakeholder.role || 'No role'}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {stakeholder.organization || 'No organization'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0`}>
            {config.label}
          </Badge>
        </div>
      </div>
      <SimpleDropdown>
        <SimpleDropdownTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 shrink-0 hover:bg-accent hover:text-accent-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </SimpleDropdownTrigger>
        <SimpleDropdownContent align="end">
          <SimpleDropdownItem>
            <a href={`mailto:${stakeholder.email}`} className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </a>
          </SimpleDropdownItem>
          {stakeholder.phone && (
            <SimpleDropdownItem>
              <a href={`tel:${stakeholder.phone}`} className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </SimpleDropdownItem>
          )}
          <SimpleDropdownItem onClick={onDelete} className="text-destructive">
            Remove
          </SimpleDropdownItem>
        </SimpleDropdownContent>
      </SimpleDropdown>
    </div>
  );
}
