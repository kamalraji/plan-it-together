import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import {
  useHeadcountConfirmations,
  useHeadcountMutations,
  useCateringMealSchedule,
  type CateringHeadcountConfirmation,
} from '@/hooks/useCateringData';

interface ConfirmHeadcountTabProps {
  workspaceId: string;
  eventId?: string;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-amber-500' },
  { value: 'lunch', label: 'Lunch', color: 'bg-orange-500' },
  { value: 'dinner', label: 'Dinner', color: 'bg-rose-500' },
  { value: 'snack', label: 'Snack', color: 'bg-purple-500' },
  { value: 'tea', label: 'Tea', color: 'bg-teal-500' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Check },
  revised: { label: 'Revised', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
};

export function ConfirmHeadcountTab({ workspaceId, eventId }: ConfirmHeadcountTabProps) {
  const { data: confirmations = [], isLoading } = useHeadcountConfirmations(workspaceId);
  const { data: mealSchedule = [] } = useCateringMealSchedule(workspaceId);
  const { createConfirmation, confirmHeadcount, updateConfirmation, deleteConfirmation } = useHeadcountMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringHeadcountConfirmation | null>(null);

  const [formData, setFormData] = useState({
    meal_name: '',
    meal_date: format(new Date(), 'yyyy-MM-dd'),
    meal_type: 'lunch',
    expected_count: 0,
    confirmation_deadline: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      meal_name: '',
      meal_date: format(new Date(), 'yyyy-MM-dd'),
      meal_type: 'lunch',
      expected_count: 0,
      confirmation_deadline: '',
      notes: '',
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: CateringHeadcountConfirmation) => {
    setEditingItem(item);
    setFormData({
      meal_name: item.meal_name,
      meal_date: item.meal_date,
      meal_type: item.meal_type,
      expected_count: item.expected_count,
      confirmation_deadline: item.confirmation_deadline ? format(parseISO(item.confirmation_deadline), "yyyy-MM-dd'T'HH:mm") : '',
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.meal_name.trim()) return;

    if (editingItem) {
      await updateConfirmation.mutateAsync({
        id: editingItem.id,
        meal_name: formData.meal_name,
        meal_date: formData.meal_date,
        meal_type: formData.meal_type,
        expected_count: formData.expected_count,
        confirmation_deadline: formData.confirmation_deadline || null,
        notes: formData.notes || null,
      });
    } else {
      await createConfirmation.mutateAsync({
        meal_name: formData.meal_name,
        meal_date: formData.meal_date,
        meal_type: formData.meal_type,
        expected_count: formData.expected_count,
        confirmation_deadline: formData.confirmation_deadline || null,
        notes: formData.notes || null,
        event_id: eventId || null,
      });
    }
    resetForm();
  };

  const handleConfirm = async (id: string, confirmedCount: number) => {
    await confirmHeadcount.mutateAsync({ id, confirmed_count: confirmedCount });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this confirmation?')) {
      await deleteConfirmation.mutateAsync(id);
    }
  };

  // Quick confirm with current expected count
  const quickConfirm = (item: CateringHeadcountConfirmation) => {
    handleConfirm(item.id, item.expected_count);
  };

  // Import from meal schedule
  const importFromSchedule = () => {
    if (mealSchedule.length === 0) return;
    
    const meal = mealSchedule[0];
    setFormData({
      meal_name: meal.name,
      meal_date: format(parseISO(meal.scheduled_time), 'yyyy-MM-dd'),
      meal_type: meal.meal_type,
      expected_count: meal.expected_guests,
      confirmation_deadline: '',
      notes: meal.notes || '',
    });
  };

  // Stats
  const stats = {
    total: confirmations.length,
    pending: confirmations.filter(c => c.status === 'pending').length,
    confirmed: confirmations.filter(c => c.status === 'confirmed').length,
    totalExpected: confirmations.reduce((sum, c) => sum + c.expected_count, 0),
    totalConfirmed: confirmations.reduce((sum, c) => sum + (c.confirmed_count || 0), 0),
  };

  // Group by date
  const groupedByDate = confirmations.reduce((acc, conf) => {
    const date = conf.meal_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(conf);
    return acc;
  }, {} as Record<string, CateringHeadcountConfirmation[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Confirm Headcount
          </h2>
          <p className="text-muted-foreground">Track and confirm meal headcounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Headcount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Headcount' : 'Add Headcount Confirmation'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {mealSchedule.length > 0 && !editingItem && (
                <Button variant="outline" size="sm" onClick={importFromSchedule} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Import from Meal Schedule
                </Button>
              )}

              <div className="space-y-2">
                <Label>Meal Name *</Label>
                <Input
                  value={formData.meal_name}
                  onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                  placeholder="e.g., Day 1 Lunch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.meal_date}
                    onChange={(e) => setFormData({ ...formData, meal_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <Select
                    value={formData.meal_type}
                    onValueChange={(v) => setFormData({ ...formData, meal_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(mt => (
                        <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Count</Label>
                  <Input
                    type="number"
                    value={formData.expected_count}
                    onChange={(e) => setFormData({ ...formData, expected_count: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.confirmation_deadline}
                    onChange={(e) => setFormData({ ...formData, confirmation_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createConfirmation.isPending || updateConfirmation.isPending}>
                  {(createConfirmation.isPending || updateConfirmation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Add'} Headcount
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Meals</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending Confirmation</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {stats.totalConfirmed} / {stats.totalExpected}
            </div>
            <div className="text-xs text-muted-foreground">Total Guests</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations Alert */}
      {stats.pending > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              {stats.pending} Pending Confirmation{stats.pending > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please confirm the headcount for upcoming meals to ensure proper food preparation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmations by Date */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-1">No headcount confirmations</h3>
            <p className="text-muted-foreground text-sm">Add meal headcounts to track and confirm guest numbers</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {getDateLabel(date)}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedByDate[date].map(conf => {
                  const mealConfig = MEAL_TYPES.find(m => m.value === conf.meal_type);
                  const statusConfig = STATUS_CONFIG[conf.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const isDeadlinePassed = conf.confirmation_deadline && isPast(parseISO(conf.confirmation_deadline));

                  return (
                    <Card key={conf.id} className="overflow-hidden">
                      <div className={`h-1 ${mealConfig?.color || 'bg-muted'}`} />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{conf.meal_name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">{mealConfig?.label || conf.meal_type}</Badge>
                          </div>
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Expected</div>
                            <div className="font-medium text-lg">{conf.expected_count}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Confirmed</div>
                            <div className="font-medium text-lg">
                              {conf.confirmed_count !== null ? conf.confirmed_count : '—'}
                            </div>
                          </div>
                        </div>

                        {conf.confirmation_deadline && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            <span className={isDeadlinePassed ? 'text-red-500' : 'text-muted-foreground'}>
                              Deadline: {format(parseISO(conf.confirmation_deadline), 'MMM d, h:mm a')}
                              {isDeadlinePassed && ' (passed)'}
                            </span>
                          </div>
                        )}

                        {conf.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{conf.notes}</p>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          {conf.status === 'pending' && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => quickConfirm(conf)}
                              disabled={confirmHeadcount.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Confirm ({conf.expected_count})
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleEdit(conf)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDelete(conf.id)}
                            disabled={deleteConfirmation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
