import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Eye, CheckCircle, XCircle, RotateCcw, Search, Star, FileText } from 'lucide-react';
import { useContentItems, useContentReviews, useSubmitReview, ContentItem } from '@/hooks/useContentCommitteeData';
import { format } from 'date-fns';

interface ReviewContentTabProps {
  workspaceId: string;
}

export function ReviewContentTab({ workspaceId }: ReviewContentTabProps) {
  const { data: contentItems = [], isLoading: itemsLoading } = useContentItems(workspaceId);
  const { data: reviews = [], isLoading: reviewsLoading } = useContentReviews(workspaceId);
  const submitReview = useSubmitReview();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'revision_requested'>('approved');

  // Get items that are in review status
  const reviewableItems = contentItems.filter((item) => 
    item.status === 'review' || item.review_status === 'pending' || item.review_status === 'in_review'
  );

  const filteredItems = reviewableItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.review_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReview = (item: ContentItem) => {
    setSelectedItem(item);
    setReviewFeedback('');
    setReviewScore(5);
    setReviewDecision('approved');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedItem) return;

    // Find the review record for this content item
    const review = reviews.find((r) => r.content_item_id === selectedItem.id);

    submitReview.mutate({
      reviewId: review?.id || '',
      status: reviewDecision,
      feedback: reviewFeedback,
      score: reviewScore,
      workspaceId,
      contentItemId: selectedItem.id,
    }, {
      onSuccess: () => {
        setReviewDialogOpen(false);
        setSelectedItem(null);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      in_review: { variant: 'default', label: 'In Review' },
      approved: { variant: 'outline', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      revision_requested: { variant: 'secondary', label: 'Revision Needed' },
    };
    const { variant, label } = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const isLoading = itemsLoading || reviewsLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Review Content Queue
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredItems.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="revision_requested">Revision Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content items awaiting review</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.content_type}</Badge>
                      </TableCell>
                      <TableCell>{item.author_name || 'Unknown'}</TableCell>
                      <TableCell>{item.reviewer_name || 'Unassigned'}</TableCell>
                      <TableCell>{getStatusBadge(item.review_status || 'pending')}</TableCell>
                      <TableCell>{format(new Date(item.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Content: {selectedItem?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Content Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Preview</label>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedItem?.description || 'No content preview available'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Review Score */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality Score</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    variant={reviewScore >= score ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReviewScore(score)}
                    className="w-10 h-10"
                  >
                    <Star className={`h-4 w-4 ${reviewScore >= score ? 'fill-current' : ''}`} />
                  </Button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{reviewScore}/5</span>
              </div>
            </div>

            {/* Decision */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Decision</label>
              <div className="flex gap-2">
                <Button
                  variant={reviewDecision === 'approved' ? 'default' : 'outline'}
                  onClick={() => setReviewDecision('approved')}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant={reviewDecision === 'revision_requested' ? 'default' : 'outline'}
                  onClick={() => setReviewDecision('revision_requested')}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  variant={reviewDecision === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setReviewDecision('rejected')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                placeholder="Provide detailed feedback for the author..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
