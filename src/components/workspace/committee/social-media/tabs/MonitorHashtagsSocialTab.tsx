import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Hash, Plus, TrendingUp, TrendingDown, Minus, Star, Copy, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHashtags, useCreateHashtag, useUpdateHashtag, useDeleteHashtag, Hashtag } from '@/hooks/useSocialMediaCommitteeData';

interface MonitorHashtagsSocialTabProps {
  workspaceId: string;
}

const CATEGORIES = [
  { id: 'brand', label: 'Brand' },
  { id: 'event', label: 'Event' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'trending', label: 'Trending' },
  { id: 'product', label: 'Product' },
];

const TREND_ICONS = {
  trending: { icon: TrendingUp, color: 'text-emerald-500' },
  stable: { icon: Minus, color: 'text-amber-500' },
  declining: { icon: TrendingDown, color: 'text-red-500' },
};

export function MonitorHashtagsSocialTab({ workspaceId }: MonitorHashtagsSocialTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHashtag, setEditingHashtag] = useState<Hashtag | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Queries & Mutations
  const { data: hashtags = [], isLoading } = useHashtags(workspaceId);
  const createHashtag = useCreateHashtag(workspaceId);
  const updateHashtag = useUpdateHashtag(workspaceId);
  const deleteHashtag = useDeleteHashtag(workspaceId);

  const filteredHashtags = categoryFilter === 'all' 
    ? hashtags 
    : hashtags.filter(h => h.category === categoryFilter);

  const primaryHashtags = hashtags.filter(h => h.is_primary);

  const resetForm = () => {
    setTag('');
    setCategory('');
    setIsPrimary(false);
    setEditingHashtag(null);
  };

  const openEditDialog = (hashtag: Hashtag) => {
    setEditingHashtag(hashtag);
    setTag(hashtag.tag);
    setCategory(hashtag.category || '');
    setIsPrimary(hashtag.is_primary);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const cleanedTag = tag.replace(/^#/, '').trim();
    if (!cleanedTag) return;

    const data = {
      tag: cleanedTag,
      category: category || null,
      is_primary: isPrimary,
    };

    if (editingHashtag) {
      updateHashtag.mutate({ id: editingHashtag.id, ...data });
    } else {
      createHashtag.mutate(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this hashtag?')) {
      deleteHashtag.mutate(id);
    }
  };

  const handleTogglePrimary = (hashtag: Hashtag) => {
    updateHashtag.mutate({ id: hashtag.id, is_primary: !hashtag.is_primary });
  };

  const copyAllHashtags = () => {
    const hashtagString = primaryHashtags.map(h => `#${h.tag}`).join(' ');
    navigator.clipboard.writeText(hashtagString);
    toast.success('Primary hashtags copied to clipboard!');
  };

  const copyHashtag = (tagName: string) => {
    navigator.clipboard.writeText(`#${tagName}`);
    toast.success('Hashtag copied!');
  };

  const getTrendIcon = (trend: string) => {
    const config = TREND_ICONS[trend as keyof typeof TREND_ICONS] || TREND_ICONS.stable;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hashtag Monitor</h2>
          <p className="text-muted-foreground">Track and manage your hashtag performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Hashtag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHashtag ? 'Edit Hashtag' : 'Add New Hashtag'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Hashtag</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={tag} 
                    onChange={(e) => setTag(e.target.value.replace(/^#/, ''))}
                    placeholder="hashtag"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="primary" className="cursor-pointer">Mark as primary hashtag</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!tag.trim()}>
                  {editingHashtag ? 'Update' : 'Add Hashtag'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Primary Hashtags Card */}
      {primaryHashtags.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Primary Hashtags
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyAllHashtags} className="gap-2">
                <Copy className="h-3.5 w-3.5" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {primaryHashtags.map((hashtag) => (
                <Badge
                  key={hashtag.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => copyHashtag(hashtag.tag)}
                >
                  #{hashtag.tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{hashtags.length}</div>
            <p className="text-sm text-muted-foreground">Total Hashtags</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {hashtags.filter(h => h.trend === 'trending').length}
            </div>
            <p className="text-sm text-muted-foreground">Trending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {primaryHashtags.length}
            </div>
            <p className="text-sm text-muted-foreground">Primary Tags</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {hashtags.reduce((sum, h) => sum + h.uses_count, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Uses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryFilter === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Hashtags Table */}
      {filteredHashtags.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Hash className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No hashtags yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking hashtags to monitor their performance
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Add Hashtag</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hashtag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Uses</TableHead>
                  <TableHead className="text-right">Reach</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHashtags.map((hashtag) => (
                  <TableRow key={hashtag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hashtag.is_primary && <Star className="h-3.5 w-3.5 text-amber-500" />}
                        <span className="font-medium">#{hashtag.tag}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hashtag.category && (
                        <Badge variant="outline" className="capitalize">{hashtag.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{hashtag.uses_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{hashtag.reach.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{hashtag.engagement_rate}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(hashtag.trend)}
                        <span className="text-sm capitalize">{hashtag.trend}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleTogglePrimary(hashtag)}
                          title={hashtag.is_primary ? 'Remove from primary' : 'Add to primary'}
                        >
                          <Star className={`h-3.5 w-3.5 ${hashtag.is_primary ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyHashtag(hashtag.tag)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(hashtag)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(hashtag.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
