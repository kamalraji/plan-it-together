import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RecurrenceType, CreateRecurringTaskDTO, RECURRENCE_PRESETS, getNextOccurrences } from '@/lib/recurringTaskTypes';
import { TaskPriority } from '@/types';
import { CalendarIcon, Clock, RefreshCw } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: CreateRecurringTaskDTO) => void;
  isLoading?: boolean;
  workspaceId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function RecurringTaskForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  workspaceId,
}: RecurringTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [dailyInterval, setDailyInterval] = useState(1);
  const [weeklyInterval, setWeeklyInterval] = useState(1);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1]); // Monday
  const [monthlyInterval, setMonthlyInterval] = useState(1);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [maxOccurrences, setMaxOccurrences] = useState<number | undefined>();
  const [hasEndDate, setHasEndDate] = useState(false);
  const [hasMaxOccurrences, setHasMaxOccurrences] = useState(false);

  const handlePresetClick = (presetKey: keyof typeof RECURRENCE_PRESETS) => {
    const preset = RECURRENCE_PRESETS[presetKey];
    setRecurrenceType(preset.type);
    
    const config = preset.config;
    if ('daily' in config && config.daily) {
      setDailyInterval(config.daily.interval);
    } else if ('weekly' in config && config.weekly) {
      setWeeklyInterval(config.weekly.interval);
      setWeeklyDays(config.weekly.daysOfWeek);
    } else if ('monthly' in config && config.monthly) {
      setMonthlyInterval(config.monthly.interval);
      if (config.monthly.dayOfMonth) {
        setMonthlyDay(config.monthly.dayOfMonth);
      }
    }
  };

  const getRecurrenceConfig = () => {
    switch (recurrenceType) {
      case 'daily':
        return { daily: { interval: dailyInterval } };
      case 'weekly':
        return { weekly: { interval: weeklyInterval, daysOfWeek: weeklyDays } };
      case 'monthly':
        return { monthly: { interval: monthlyInterval, dayOfMonth: monthlyDay } };
      default:
        return {};
    }
  };

  const previewOccurrences = getNextOccurrences(
    startDate,
    recurrenceType,
    getRecurrenceConfig(),
    5
  );

  const handleSubmit = () => {
    const task: CreateRecurringTaskDTO = {
      workspaceId,
      title,
      description: description || undefined,
      priority,
      recurrenceType,
      recurrenceConfig: getRecurrenceConfig(),
      startDate: startDate.toISOString(),
      endDate: hasEndDate && endDate ? endDate.toISOString() : undefined,
      maxOccurrences: hasMaxOccurrences ? maxOccurrences : undefined,
      templateData: {},
    };
    onSubmit(task);
  };

  const toggleWeeklyDay = (day: number) => {
    if (weeklyDays.includes(day)) {
      if (weeklyDays.length > 1) {
        setWeeklyDays(weeklyDays.filter(d => d !== day));
      }
    } else {
      setWeeklyDays([...weeklyDays, day].sort());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Create Recurring Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter recurring task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(RECURRENCE_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(key as keyof typeof RECURRENCE_PRESETS)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Recurrence Config */}
          <div className="space-y-3">
            <Label>Recurrence Pattern</Label>
            <Tabs value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Repeat every</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={dailyInterval}
                    onChange={(e) => setDailyInterval(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm">day(s)</span>
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Repeat every</span>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={weeklyInterval}
                    onChange={(e) => setWeeklyInterval(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm">week(s) on:</span>
                </div>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={weeklyDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWeeklyDay(day.value)}
                      className="w-10"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Repeat every</span>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={monthlyInterval}
                    onChange={(e) => setMonthlyInterval(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm">month(s) on day</span>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={monthlyDay}
                    onChange={(e) => setMonthlyDay(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Conditions */}
          <div className="space-y-4">
            <Label>End Conditions (Optional)</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasEndDate"
                checked={hasEndDate}
                onCheckedChange={(checked) => setHasEndDate(!!checked)}
              />
              <label htmlFor="hasEndDate" className="text-sm">End on specific date</label>
            </div>
            {hasEndDate && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date <= startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasMaxOccurrences"
                checked={hasMaxOccurrences}
                onCheckedChange={(checked) => setHasMaxOccurrences(!!checked)}
              />
              <label htmlFor="hasMaxOccurrences" className="text-sm">Stop after</label>
              {hasMaxOccurrences && (
                <>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={maxOccurrences || ''}
                    onChange={(e) => setMaxOccurrences(parseInt(e.target.value) || undefined)}
                    className="w-20"
                  />
                  <span className="text-sm">occurrences</span>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next 5 Occurrences
            </Label>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <ul className="space-y-1 text-sm">
                {previewOccurrences.map((date, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-6 text-muted-foreground">{index + 1}.</span>
                    <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {isLoading ? 'Creating...' : 'Create Recurring Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
