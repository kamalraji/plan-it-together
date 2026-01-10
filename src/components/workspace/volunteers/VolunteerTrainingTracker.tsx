import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Shield, 
  Users, 
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VolunteerTrainingTrackerProps {
  workspaceId: string;
}

interface TrainingModule {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  required: boolean;
  completed: boolean;
  link?: string;
}

const DEFAULT_MODULES: Omit<TrainingModule, 'id' | 'completed'>[] = [
  { name: 'Orientation', description: 'Event overview and volunteer expectations', duration: '30 min', required: true },
  { name: 'Safety Training', description: 'Emergency procedures and safety protocols', duration: '20 min', required: true },
  { name: 'Role-Specific Training', description: 'Training for your assigned role', duration: '45 min', required: false },
  { name: 'Communication Guidelines', description: 'How to interact with attendees', duration: '15 min', required: false },
];

export function VolunteerTrainingTracker({ workspaceId }: VolunteerTrainingTrackerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newModule, setNewModule] = useState({ name: '', description: '', duration: '', link: '' });
  const queryClient = useQueryClient();

  // Fetch training checklist from workspace_checklists
  const { data: trainingData, isLoading } = useQuery({
    queryKey: ['volunteer-training', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('title', 'Volunteer Training')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default training checklist
        const defaultItems = DEFAULT_MODULES.map((m, i) => ({
          id: `module-${i}`,
          text: m.name,
          description: m.description,
          duration: m.duration,
          required: m.required,
          completed: false,
        }));

        const { data: newChecklist, error: createError } = await supabase
          .from('workspace_checklists')
          .insert({
            workspace_id: workspaceId,
            title: 'Volunteer Training',
            committee_type: 'VOLUNTEERS',
            items: defaultItems,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newChecklist;
      }

      return data;
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (items: any[]) => {
      if (!trainingData?.id) throw new Error('No training data');
      const { error } = await supabase
        .from('workspace_checklists')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('id', trainingData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-training', workspaceId] });
    },
  });

  const modules = (trainingData?.items as any[]) || [];
  const completedCount = modules.filter((m: any) => m.completed).length;
  const requiredCount = modules.filter((m: any) => m.required).length;
  const requiredCompleted = modules.filter((m: any) => m.required && m.completed).length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  const handleToggleModule = (moduleId: string) => {
    const updatedModules = modules.map((m: any) => 
      m.id === moduleId ? { ...m, completed: !m.completed } : m
    );
    updateTrainingMutation.mutate(updatedModules);
  };

  const handleAddModule = () => {
    if (!newModule.name.trim()) return;

    const newItem = {
      id: `module-${Date.now()}`,
      text: newModule.name,
      description: newModule.description,
      duration: newModule.duration,
      link: newModule.link,
      required: false,
      completed: false,
    };

    updateTrainingMutation.mutate([...modules, newItem]);
    setNewModule({ name: '', description: '', duration: '', link: '' });
    setIsAddOpen(false);
    toast.success('Training module added');
  };

  const getModuleIcon = (name: string) => {
    if (name.toLowerCase().includes('safety')) return Shield;
    if (name.toLowerCase().includes('orientation')) return Users;
    if (name.toLowerCase().includes('role')) return BookOpen;
    return GraduationCap;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="training-tracker">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Training Tracker</CardTitle>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Training Module</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Module Name</Label>
                  <Input
                    value={newModule.name}
                    onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                    placeholder="e.g., First Aid Basics"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    placeholder="Brief description of the training"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={newModule.duration}
                      onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                      placeholder="e.g., 30 min"
                    />
                  </div>
                  <div>
                    <Label>Link (optional)</Label>
                    <Input
                      value={newModule.link}
                      onChange={(e) => setNewModule({ ...newModule, link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <Button onClick={handleAddModule} className="w-full">
                  Add Module
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completedCount}/{modules.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
          {requiredCompleted < requiredCount && (
            <p className="text-xs text-amber-600">
              {requiredCount - requiredCompleted} required module(s) remaining
            </p>
          )}
        </div>

        {/* Module List */}
        <div className="space-y-2">
          {modules.map((module: any) => {
            const Icon = getModuleIcon(module.text);
            return (
              <div
                key={module.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  module.completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={module.completed}
                  onCheckedChange={() => handleToggleModule(module.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-medium text-sm ${module.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {module.text}
                    </span>
                    {module.required && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {module.duration && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.duration}
                      </span>
                    )}
                    {module.link && (
                      <a
                        href={module.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Materials
                      </a>
                    )}
                  </div>
                </div>
                {module.completed && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
