import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Trash2, 
  Shuffle,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import {
  useWorkspaceJudges,
  useCreateJudge,
  useDeleteJudge,
  useWorkspaceSubmissions,
  useWorkspaceAssignments,
  useCreateAssignment,
  useBulkAssignJudges,
  useDeleteAssignment,
  useJudgingProgress,
} from '@/hooks/useJudgeCommitteeData';
import { JudgePortalShareButton, JudgePortalNavigateButton } from '../JudgePortalShareButton';

interface AssignJudgesCommitteeTabProps {
  workspaceId: string;
}

const JUDGE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'innovation', label: 'Innovation' },
];

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  declined: 'bg-destructive/10 text-destructive',
  active: 'bg-info/10 text-info',
};

export function AssignJudgesCommitteeTab({ workspaceId }: AssignJudgesCommitteeTabProps) {
  const [isAddJudgeOpen, setIsAddJudgeOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [newJudge, setNewJudge] = useState({
    judge_name: '',
    judge_email: '',
    expertise: '',
    category: 'general',
  });

  const { data: judges = [], isLoading: judgesLoading } = useWorkspaceJudges(workspaceId);
  const { data: submissions = [] } = useWorkspaceSubmissions(workspaceId);
  const { data: assignments = [] } = useWorkspaceAssignments(workspaceId);
  const { data: progress } = useJudgingProgress(workspaceId);

  const createJudge = useCreateJudge(workspaceId);
  const deleteJudge = useDeleteJudge(workspaceId);
  const createAssignment = useCreateAssignment(workspaceId);
  const bulkAssign = useBulkAssignJudges(workspaceId);
  const deleteAssignment = useDeleteAssignment(workspaceId);

  const handleAddJudge = () => {
    if (!newJudge.judge_name.trim()) return;
    createJudge.mutate(newJudge, {
      onSuccess: () => {
        setNewJudge({ judge_name: '', judge_email: '', expertise: '', category: 'general' });
        setIsAddJudgeOpen(false);
      },
    });
  };

  const handleBulkAssign = () => {
    if (selectedJudges.length === 0 || selectedSubmissions.length === 0) return;
    bulkAssign.mutate(
      { judgeIds: selectedJudges, submissionIds: selectedSubmissions },
      {
        onSuccess: () => {
          setSelectedJudges([]);
          setSelectedSubmissions([]);
          setIsAssignDialogOpen(false);
        },
      }
    );
  };

  const handleAutoAssign = () => {
    // Simple round-robin auto-assignment
    const activeJudges = judges.filter(j => j.status === 'confirmed' || j.status === 'active');
    if (activeJudges.length === 0 || submissions.length === 0) return;

    const assignmentsToCreate: { judgeIds: string[]; submissionIds: string[] } = {
      judgeIds: [],
      submissionIds: [],
    };

    // Assign 3 judges per submission
    submissions.forEach((sub, idx) => {
      const judgesPerSubmission = 3;
      for (let i = 0; i < judgesPerSubmission; i++) {
        const judgeIdx = (idx * judgesPerSubmission + i) % activeJudges.length;
        const judgeId = activeJudges[judgeIdx].id;
        
        // Check if already assigned
        const alreadyAssigned = assignments.some(
          a => a.judge_id === judgeId && a.submission_id === sub.id
        );
        
        if (!alreadyAssigned) {
          assignmentsToCreate.judgeIds.push(judgeId);
          assignmentsToCreate.submissionIds.push(sub.id);
        }
      }
    });

    if (assignmentsToCreate.judgeIds.length > 0) {
      // Create assignments one by one for proper tracking
      assignmentsToCreate.judgeIds.forEach((judgeId, idx) => {
        createAssignment.mutate({
          judge_id: judgeId,
          submission_id: assignmentsToCreate.submissionIds[idx],
        });
      });
    }
  };

  const getJudgeAssignmentCount = (judgeId: string) => {
    return assignments.filter(a => a.judge_id === judgeId).length;
  };

  const getJudgeCompletedCount = (judgeId: string) => {
    return assignments.filter(a => a.judge_id === judgeId && a.status === 'completed').length;
  };

  return (
    <div className="space-y-6">
      {/* Portal Access Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Judge Portal</CardTitle>
              <CardDescription>
                Share the portal link with judges so they can access their scoring dashboard
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <JudgePortalShareButton variant="outline" />
              <JudgePortalNavigateButton variant="default" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Judges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.totalJudges || 0}</div>
            <p className="text-xs text-muted-foreground">
              {progress?.activeJudges || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {progress?.judgedSubmissions || 0} judged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.totalAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {progress?.completedAssignments || 0} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.percentComplete || 0}%</div>
            <Progress value={progress?.percentComplete || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Judge Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Judge Panel
            </CardTitle>
            <CardDescription>Manage judges and their assignments</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAutoAssign} disabled={judges.length === 0}>
              <Shuffle className="mr-2 h-4 w-4" />
              Auto-Assign
            </Button>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Bulk Assign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Assign Judges</DialogTitle>
                  <DialogDescription>
                    Select judges and submissions to create assignments
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Select Judges</Label>
                    <ScrollArea className="h-48 rounded border p-2">
                      {judges.map(judge => (
                        <div key={judge.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            checked={selectedJudges.includes(judge.id)}
                            onCheckedChange={(checked) => {
                              setSelectedJudges(prev =>
                                checked
                                  ? [...prev, judge.id]
                                  : prev.filter(id => id !== judge.id)
                              );
                            }}
                          />
                          <span className="text-sm">{judge.judge_name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div>
                    <Label className="mb-2 block">Select Submissions</Label>
                    <ScrollArea className="h-48 rounded border p-2">
                      {submissions.map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            checked={selectedSubmissions.includes(sub.id)}
                            onCheckedChange={(checked) => {
                              setSelectedSubmissions(prev =>
                                checked
                                  ? [...prev, sub.id]
                                  : prev.filter(id => id !== sub.id)
                              );
                            }}
                          />
                          <span className="text-sm">{sub.project_name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAssign} disabled={bulkAssign.isPending}>
                    Create Assignments
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddJudgeOpen} onOpenChange={setIsAddJudgeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Judge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Judge</DialogTitle>
                  <DialogDescription>
                    Add a judge to the panel for this workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Judge name"
                      value={newJudge.judge_name}
                      onChange={e => setNewJudge(prev => ({ ...prev, judge_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="judge@example.com"
                      value={newJudge.judge_email}
                      onChange={e => setNewJudge(prev => ({ ...prev, judge_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Expertise</Label>
                    <Input
                      id="expertise"
                      placeholder="e.g., AI/ML, Web Development"
                      value={newJudge.expertise}
                      onChange={e => setNewJudge(prev => ({ ...prev, expertise: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newJudge.category}
                      onValueChange={val => setNewJudge(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JUDGE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddJudgeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddJudge} disabled={createJudge.isPending}>
                    Add Judge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {judgesLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading judges...</div>
          ) : judges.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No judges added yet</p>
              <Button variant="link" onClick={() => setIsAddJudgeOpen(true)}>
                Add your first judge
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map(judge => {
                  const assigned = getJudgeAssignmentCount(judge.id);
                  const completed = getJudgeCompletedCount(judge.id);
                  const progressPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

                  return (
                    <TableRow key={judge.id}>
                      <TableCell className="font-medium">{judge.judge_name}</TableCell>
                      <TableCell>
                        {judge.judge_email ? (
                          <a href={`mailto:${judge.judge_email}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Mail className="h-3 w-3" />
                            {judge.judge_email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{judge.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[judge.status] || ''}>
                          {judge.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{assigned}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPct} className="w-16" />
                          <span className="text-xs text-muted-foreground">
                            {completed}/{assigned}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteJudge.mutate(judge.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Matrix</CardTitle>
          <CardDescription>
            View and manage judge-to-submission assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No submissions to assign</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Submission</TableHead>
                    {judges.map(judge => (
                      <TableHead key={judge.id} className="text-center min-w-[100px]">
                        <div className="truncate max-w-[80px]" title={judge.judge_name}>
                          {judge.judge_name.split(' ')[0]}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="truncate max-w-[150px]" title={sub.project_name}>
                          {sub.project_name}
                        </div>
                      </TableCell>
                      {judges.map(judge => {
                        const assignment = assignments.find(
                          a => a.judge_id === judge.id && a.submission_id === sub.id
                        );
                        return (
                          <TableCell key={judge.id} className="text-center">
                            {assignment ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteAssignment.mutate(assignment.id)}
                              >
                                {assignment.status === 'completed' ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                  <Clock className="h-5 w-5 text-warning" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => createAssignment.mutate({
                                  judge_id: judge.id,
                                  submission_id: sub.id,
                                })}
                              >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
