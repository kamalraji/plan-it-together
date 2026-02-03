import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Camera, 
  Video, 
  MapPin, 
  Clock, 
  User,
  Trash2,
  Edit2,
  GripVertical,
  Printer,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { 
  useShotLists, 
  useCreateShotList, 
  useUpdateShotList, 
  useDeleteShotList,
  ShotListItem 
} from '@/hooks/useMediaCommitteeData';


interface CreateShotListTabProps {
  workspaceId: string;
}

const SHOT_TEMPLATES = [
  { title: 'VIP Arrival', description: 'Capture VIPs arriving at venue', priority: 'high' as const, shot_type: 'photo' as const },
  { title: 'Stage Wide Shot', description: 'Full stage with speaker', priority: 'high' as const, shot_type: 'both' as const },
  { title: 'Audience Reaction', description: 'Engaged audience members', priority: 'medium' as const, shot_type: 'photo' as const },
  { title: 'Networking Candids', description: 'Natural conversations and interactions', priority: 'medium' as const, shot_type: 'photo' as const },
  { title: 'Venue Establishing', description: 'Wide shots of venue and setup', priority: 'low' as const, shot_type: 'both' as const },
  { title: 'Speaker Close-up', description: 'Tight shot of speaker presenting', priority: 'high' as const, shot_type: 'video' as const },
  { title: 'Brand/Sponsor Signage', description: 'Capture sponsor banners and branding', priority: 'medium' as const, shot_type: 'photo' as const },
  { title: 'Food & Beverage', description: 'Catering setup and dining area', priority: 'low' as const, shot_type: 'photo' as const },
];

export function CreateShotListTab({ workspaceId }: CreateShotListTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<ShotListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedShots, setSelectedShots] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventSegment, setEventSegment] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [shotType, setShotType] = useState<'photo' | 'video' | 'both'>('photo');
  const [cameraSettings, setCameraSettings] = useState('');
  const [notes, setNotes] = useState('');

  const { data: shotLists = [], isLoading } = useShotLists(workspaceId);
  const createMutation = useCreateShotList(workspaceId);
  const updateMutation = useUpdateShotList(workspaceId);
  const deleteMutation = useDeleteShotList(workspaceId);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventSegment('');
    setLocation('');
    setPriority('medium');
    setShotType('photo');
    setCameraSettings('');
    setNotes('');
    setEditingShot(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const shotData = {
      title,
      description: description || null,
      event_segment: eventSegment || null,
      location: location || null,
      priority,
      shot_type: shotType,
      camera_settings: cameraSettings || null,
      notes: notes || null,
    };

    if (editingShot) {
      await updateMutation.mutateAsync({ id: editingShot.id, updates: shotData });
    } else {
      await createMutation.mutateAsync(shotData);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (shot: ShotListItem) => {
    setEditingShot(shot);
    setTitle(shot.title);
    setDescription(shot.description || '');
    setEventSegment(shot.event_segment || '');
    setLocation(shot.location || '');
    setPriority(shot.priority);
    setShotType(shot.shot_type);
    setCameraSettings(shot.camera_settings || '');
    setNotes(shot.notes || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (shotId: string) => {
    await deleteMutation.mutateAsync(shotId);
  };

  const handleStatusChange = async (shot: ShotListItem, newStatus: ShotListItem['status']) => {
    await updateMutation.mutateAsync({ id: shot.id, updates: { status: newStatus } });
  };

  const addFromTemplate = (template: typeof SHOT_TEMPLATES[0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setPriority(template.priority);
    setShotType(template.shot_type);
    setIsDialogOpen(true);
  };

  const toggleSelectShot = (shotId: string) => {
    setSelectedShots(prev => 
      prev.includes(shotId) ? prev.filter(id => id !== shotId) : [...prev, shotId]
    );
  };

  const filteredShots = shotLists.filter(shot => {
    if (filterStatus !== 'all' && shot.status !== filterStatus) return false;
    if (filterPriority !== 'all' && shot.priority !== filterPriority) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'captured':
      case 'reviewed':
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-muted';
    }
  };

  const stats = {
    total: shotLists.length,
    pending: shotLists.filter(s => s.status === 'pending').length,
    captured: shotLists.filter(s => s.status === 'captured' || s.status === 'reviewed' || s.status === 'published').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shot List</h2>
          <p className="text-muted-foreground">Plan and track required shots</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print List
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Shot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingShot ? 'Edit Shot' : 'Add New Shot'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., VIP Arrival Shot"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What should be captured..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
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

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={shotType} onValueChange={(v) => setShotType(v as typeof shotType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Main Stage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Event Segment</Label>
                    <Input
                      value={eventSegment}
                      onChange={(e) => setEventSegment(e.target.value)}
                      placeholder="e.g., Opening"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Camera Settings (optional)</Label>
                  <Input
                    value={cameraSettings}
                    onChange={(e) => setCameraSettings(e.target.value)}
                    placeholder="e.g., f/2.8, 1/250s, ISO 800"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!title.trim() || createMutation.isPending || updateMutation.isPending}>
                    {editingShot ? 'Save Changes' : 'Add Shot'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Shots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.captured}</div>
            <p className="text-sm text-muted-foreground">Captured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shot List */}
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : filteredShots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No shots in list</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add shots manually or use a template to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredShots.map((shot) => (
                <Card key={shot.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedShots.includes(shot.id)}
                        onCheckedChange={() => toggleSelectShot(shot.id)}
                      />
                      <GripVertical className="h-5 w-5 text-muted-foreground/50 mt-0.5 cursor-grab" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shot.status)}
                          <h4 className="font-medium">{shot.title}</h4>
                          <Badge variant="outline" className={getPriorityColor(shot.priority)}>
                            {shot.priority}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            {shot.shot_type === 'photo' && <Camera className="h-3 w-3" />}
                            {shot.shot_type === 'video' && <Video className="h-3 w-3" />}
                            {shot.shot_type === 'both' && <>📸🎬</>}
                            {shot.shot_type}
                          </Badge>
                        </div>
                        {shot.description && (
                          <p className="text-sm text-muted-foreground mt-1">{shot.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {shot.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shot.location}
                            </span>
                          )}
                          {shot.event_segment && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {shot.event_segment}
                            </span>
                          )}
                          {shot.assignee_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {shot.assignee_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={shot.status}
                          onValueChange={(v) => handleStatusChange(shot, v as ShotListItem['status'])}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="captured">Captured</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(shot)} aria-label="Edit shot">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(shot.id)} aria-label="Delete shot">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Add Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SHOT_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3"
                  onClick={() => addFromTemplate(template)}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
