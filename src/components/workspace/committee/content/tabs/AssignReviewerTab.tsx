import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Search, Users, FileText, AlertCircle } from 'lucide-react';
import { useContentItems, useAssignReviewer, ContentItem } from '@/hooks/useContentCommitteeData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AssignReviewerTabProps {
  workspaceId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
}

export function AssignReviewerTab({ workspaceId }: AssignReviewerTabProps) {
  const { data: contentItems = [], isLoading: itemsLoading } = useContentItems(workspaceId);
  const assignReviewer = useAssignReviewer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [singleItem, setSingleItem] = useState<ContentItem | null>(null);

  // Fetch team members for reviewer selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');

      if (error) throw error;
      return (data || []).map((m) => ({ ...m, user_name: m.user_id?.slice(0, 8) || 'Unknown' })) as TeamMember[];
    },
    enabled: !!workspaceId,
  });

  // Filter items that need reviewer assignment (draft or no reviewer)
  const unassignedItems = contentItems.filter((item) => 
    (item.status === 'draft' || item.status === 'review') && !item.reviewer_id
  );

  const filteredItems = unassignedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const handleOpenBulkAssign = () => {
    if (selectedItems.length === 0) return;
    setSingleItem(null);
    setSelectedReviewer('');
    setAssignDialogOpen(true);
  };

  const handleOpenSingleAssign = (item: ContentItem) => {
    setSingleItem(item);
    setSelectedItems([item.id]);
    setSelectedReviewer('');
    setAssignDialogOpen(true);
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer) return;

    const reviewer = teamMembers.find((m) => m.user_id === selectedReviewer);
    if (!reviewer) return;

    const itemsToAssign = singleItem ? [singleItem.id] : selectedItems;

    for (const itemId of itemsToAssign) {
      await assignReviewer.mutateAsync({
        contentItemId: itemId,
        workspaceId,
        reviewerId: reviewer.user_id,
        reviewerName: reviewer.user_name,
      });
    }

    setAssignDialogOpen(false);
    setSelectedItems([]);
    setSingleItem(null);
    setSelectedReviewer('');
  };

  // Calculate reviewer workload
  const reviewerWorkload = contentItems.reduce((acc, item) => {
    if (item.reviewer_id && item.status === 'review') {
      acc[item.reviewer_id] = (acc[item.reviewer_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              Assign Reviewers
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {unassignedItems.length} unassigned
              </Badge>
              {selectedItems.length > 0 && (
                <Button onClick={handleOpenBulkAssign}>
                  Assign Selected ({selectedItems.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">All content items have reviewers assigned</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.content_type}</Badge>
                      </TableCell>
                      <TableCell>{item.author_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(item.created_at), 'MMM d')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenSingleAssign(item)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Reviewer Workload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Reviewer Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No team members found. Add team members to assign as reviewers.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.user_name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant={reviewerWorkload[member.user_id] ? 'default' : 'secondary'}>
                        {reviewerWorkload[member.user_id] || 0} items
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {singleItem ? `Assign Reviewer: ${singleItem.title}` : `Assign Reviewer to ${selectedItems.length} items`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Reviewer</label>
              <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{member.user_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {reviewerWorkload[member.user_id] || 0} items
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignReviewer}
              disabled={!selectedReviewer || assignReviewer.isPending}
            >
              {assignReviewer.isPending ? 'Assigning...' : 'Assign Reviewer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
