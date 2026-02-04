import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  ClipboardList, 
  Trash2, 
  Edit2, 
  Copy, 
  GripVertical,
  FileText,
  Star
} from 'lucide-react';
import {
  useWorkspaceRubrics,
  useCreateRubric,
  useUpdateRubric,
  useDeleteRubric,
  WorkspaceRubric,
  RubricCriterion,
  RUBRIC_TEMPLATES,
} from '@/hooks/useJudgeCommitteeData';

interface SetupRubricsTabProps {
  workspaceId: string;
}

const RUBRIC_CATEGORIES = [
  { value: 'overall', label: 'Overall' },
  { value: 'technical', label: 'Technical' },
  { value: 'design', label: 'Design' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'innovation', label: 'Innovation' },
];

const generateCriterionId = () => Math.random().toString(36).substring(2, 9);

export function SetupRubricsTab({ workspaceId }: SetupRubricsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<WorkspaceRubric | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'overall',
    criteria: [] as RubricCriterion[],
    max_total_score: 100,
    is_active: true,
  });

  const { data: rubrics = [], isLoading } = useWorkspaceRubrics(workspaceId);
  const createRubric = useCreateRubric(workspaceId);
  const updateRubric = useUpdateRubric(workspaceId);
  const deleteRubric = useDeleteRubric(workspaceId);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'overall',
      criteria: [],
      max_total_score: 100,
      is_active: true,
    });
    setEditingRubric(null);
  };

  const loadTemplate = (templateKey: keyof typeof RUBRIC_TEMPLATES) => {
    const template = RUBRIC_TEMPLATES[templateKey];
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      criteria: template.criteria.map(c => ({ ...c, id: generateCriterionId() })),
      max_total_score: template.max_total_score,
      is_active: true,
    });
  };

  const addCriterion = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        {
          id: generateCriterionId(),
          name: '',
          description: '',
          weight: 0,
          maxScore: 10,
        },
      ],
    }));
  };

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeCriterion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== id),
    }));
  };

  const getTotalWeight = () => {
    return formData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    if (editingRubric) {
      updateRubric.mutate(
        { id: editingRubric.id, ...formData },
        {
          onSuccess: () => {
            resetForm();
            setIsCreateOpen(false);
          },
        }
      );
    } else {
      createRubric.mutate(formData, {
        onSuccess: () => {
          resetForm();
          setIsCreateOpen(false);
        },
      });
    }
  };

  const handleEdit = (rubric: WorkspaceRubric) => {
    setEditingRubric(rubric);
    setFormData({
      name: rubric.name,
      description: rubric.description || '',
      category: rubric.category,
      criteria: rubric.criteria,
      max_total_score: rubric.max_total_score,
      is_active: rubric.is_active,
    });
    setIsCreateOpen(true);
  };

  const handleDuplicate = (rubric: WorkspaceRubric) => {
    setEditingRubric(null);
    setFormData({
      name: `${rubric.name} (Copy)`,
      description: rubric.description || '',
      category: rubric.category,
      criteria: rubric.criteria.map(c => ({ ...c, id: generateCriterionId() })),
      max_total_score: rubric.max_total_score,
      is_active: true,
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scoring Rubrics</h2>
          <p className="text-muted-foreground">
            Create and manage rubrics for judges to evaluate submissions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Rubric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingRubric ? 'Edit Rubric' : 'Create New Rubric'}
              </DialogTitle>
              <DialogDescription>
                Define the criteria judges will use to score submissions
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Templates */}
                {!editingRubric && (
                  <div>
                    <Label className="mb-2 block">Start from Template</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(RUBRIC_TEMPLATES).map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => loadTemplate(key as keyof typeof RUBRIC_TEMPLATES)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rubric Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Hackathon Standard"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RUBRIC_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of when to use this rubric"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Separator />

                {/* Criteria Builder */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label>Scoring Criteria</Label>
                      <p className="text-sm text-muted-foreground">
                        Total weight: {getTotalWeight()}%
                        {getTotalWeight() !== 100 && (
                          <span className="text-destructive ml-2">
                            (should equal 100%)
                          </span>
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCriterion}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Criterion
                    </Button>
                  </div>

                  {formData.criteria.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                      <ClipboardList className="mx-auto h-8 w-8 opacity-50" />
                      <p className="mt-2 text-sm">No criteria added yet</p>
                      <Button variant="link" size="sm" onClick={addCriterion}>
                        Add your first criterion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.criteria.map((criterion) => (
                        <Card key={criterion.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-2 cursor-move text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="md:col-span-2">
                                  <Label className="text-xs">Criterion Name</Label>
                                  <Input
                                    placeholder="e.g., Innovation"
                                    value={criterion.name}
                                    onChange={e => updateCriterion(criterion.id, 'name', e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Weight (%)</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={criterion.weight}
                                      onChange={e => updateCriterion(criterion.id, 'weight', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max Score</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={criterion.maxScore}
                                      onChange={e => updateCriterion(criterion.id, 'maxScore', parseInt(e.target.value) || 10)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <Input
                                  placeholder="What should judges look for?"
                                  value={criterion.description}
                                  onChange={e => updateCriterion(criterion.id, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-2"
                              onClick={() => removeCriterion(criterion.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Settings */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Rubric</Label>
                    <p className="text-sm text-muted-foreground">
                      Active rubrics can be used for scoring
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => {
                resetForm();
                setIsCreateOpen(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createRubric.isPending || updateRubric.isPending || getTotalWeight() !== 100}
              >
                {editingRubric ? 'Update Rubric' : 'Create Rubric'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rubrics List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            All Rubrics
          </CardTitle>
          <CardDescription>
            {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading rubrics...</div>
          ) : rubrics.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No rubrics created yet</p>
              <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                Create your first rubric
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrics.map(rubric => (
                  <TableRow key={rubric.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rubric.name}</div>
                        {rubric.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {rubric.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rubric.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {rubric.criteria.length} criteria
                      </div>
                    </TableCell>
                    <TableCell>{rubric.max_total_score}</TableCell>
                    <TableCell>
                      <Badge variant={rubric.is_active ? 'default' : 'secondary'}>
                        {rubric.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rubric)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(rubric)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRubric.mutate(rubric.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
