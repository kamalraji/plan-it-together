import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClipboardList, Plus, Trash2, Loader2, AlertCircle, Edit2, Save, X, Scale } from 'lucide-react';

interface ViewRubricsTabProps {
  workspace: Workspace;
}

interface RubricCriterion {
  name: string;
  description?: string;
  maxScore: number;
  weight?: number;
}

interface Rubric {
  id: string;
  name: string;
  description: string | null;
  criteria: RubricCriterion[];
  event_id: string;
  created_at: string;
  updated_at: string;
}

export function ViewRubricsTab({ workspace }: ViewRubricsTabProps) {
  const queryClient = useQueryClient();
  const eventId = workspace.eventId;

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>([{ name: '', maxScore: 10 }]);

  // Fetch rubrics for the event
  const { data: rubrics, isLoading } = useQuery({
    queryKey: ['rubrics', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        criteria: (r.criteria as unknown as RubricCriterion[]) || [],
      })) as Rubric[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (rubric: { name: string; description: string | null; criteria: RubricCriterion[] }) => {
      if (!eventId) throw new Error('No event linked');

      const { error } = await supabase
        .from('rubrics')
        .insert({
          event_id: eventId,
          name: rubric.name,
          description: rubric.description,
          criteria: rubric.criteria as unknown as Record<string, unknown>[],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics', eventId] });
      toast.success('Rubric created successfully');
      resetForm();
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast.error('Failed to create rubric: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...rubric }: { id: string; name: string; description: string | null; criteria: RubricCriterion[] }) => {
      const { error } = await supabase
        .from('rubrics')
        .update({
          name: rubric.name,
          description: rubric.description,
          criteria: rubric.criteria as unknown as Record<string, unknown>[],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics', eventId] });
      toast.success('Rubric updated successfully');
      resetForm();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update rubric: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics', eventId] });
      toast.success('Rubric deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setCriteria([{ name: '', maxScore: 10 }]);
  };

  const handleEdit = (rubric: Rubric) => {
    setEditingId(rubric.id);
    setName(rubric.name);
    setDescription(rubric.description || '');
    setCriteria(rubric.criteria);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const addCriterion = () => {
    setCriteria([...criteria, { name: '', maxScore: 10 }]);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const updateCriterion = (index: number, field: keyof RubricCriterion, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a rubric name');
      return;
    }

    const validCriteria = criteria.filter(c => c.name.trim());
    if (validCriteria.length === 0) {
      toast.error('Please add at least one criterion');
      return;
    }

    const rubricData = {
      name: name.trim(),
      description: description.trim() || null,
      criteria: validCriteria,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...rubricData });
    } else {
      createMutation.mutate(rubricData);
    }
  };

  const totalMaxScore = (rubricCriteria: RubricCriterion[]) =>
    rubricCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);

  if (!eventId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Event Linked</h3>
          <p className="text-muted-foreground mt-2">
            This workspace is not linked to an event. Rubrics require an event context.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{rubrics?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Rubrics</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Scale className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">
              {rubrics?.reduce((sum, r) => sum + r.criteria.length, 0) || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Criteria</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingId ? 'Edit Rubric' : 'Create Rubric'}
              </CardTitle>
              <CardDescription>Define scoring criteria for judges</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rubric-name">Rubric Name *</Label>
                  <Input
                    id="rubric-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Hackathon Judging Rubric"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubric-desc">Description</Label>
                  <Textarea
                    id="rubric-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the rubric..."
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Criteria</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3 pr-3">
                      {criteria.map((criterion, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={criterion.name}
                                onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                                placeholder="Criterion name"
                                className="h-8"
                              />
                              <div className="flex items-center gap-2">
                                <Label className="text-xs whitespace-nowrap">Max Score:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={criterion.maxScore}
                                  onChange={(e) => updateCriterion(index, 'maxScore', parseInt(e.target.value) || 10)}
                                  className="h-8 w-20"
                                />
                              </div>
                            </div>
                            {criteria.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeCriterion(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="text-sm text-muted-foreground text-right">
                    Total max score: {totalMaxScore(criteria)} points
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Update Rubric' : 'Create Rubric'}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rubrics List */}
        <Card className={isCreating || editingId ? '' : 'md:col-span-2'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Rubrics
              </CardTitle>
              {!isCreating && !editingId && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rubric
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rubrics?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rubrics created yet
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <div className="space-y-4">
                  {rubrics?.map((rubric) => (
                    <div
                      key={rubric.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        editingId === rubric.id ? 'border-primary' : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-medium">{rubric.name}</h4>
                          {rubric.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{rubric.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(rubric)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(rubric.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rubric.criteria.map((criterion, index) => {
                          const percentage = (criterion.maxScore / totalMaxScore(rubric.criteria)) * 100;
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span>{criterion.name}</span>
                                  <span className="text-muted-foreground">{criterion.maxScore} pts</span>
                                </div>
                                <Progress value={percentage} className="h-1.5" />
                              </div>
                              <Badge variant="outline" className="text-xs min-w-[50px] justify-center">
                                {Math.round(percentage)}%
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{rubric.criteria.length} criteria</span>
                        <span className="font-medium">Total: {totalMaxScore(rubric.criteria)} points</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
