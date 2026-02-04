import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Trophy,
  BarChart3,
  Beaker,
  Check,
} from 'lucide-react';
import {
  useABTests, 
  useCreateABTest, 
  useUpdateABTest, 
  useDeleteABTest,
  useCampaigns 
} from '@/hooks/useMarketingCommitteeData';

interface ABTestingMarketingTabProps {
  workspaceId: string;
}

const testTypes = [
  { value: 'content', label: 'Content', description: 'Test different content variations' },
  { value: 'subject', label: 'Subject Line', description: 'Test email subject lines' },
  { value: 'timing', label: 'Timing', description: 'Test different posting times' },
  { value: 'audience', label: 'Audience', description: 'Test different audience segments' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  running: 'bg-emerald-500/20 text-emerald-600',
  paused: 'bg-amber-500/20 text-amber-600',
  completed: 'bg-blue-500/20 text-blue-600',
  cancelled: 'bg-red-500/20 text-red-600',
};

export function ABTestingMarketingTab({ workspaceId }: ABTestingMarketingTabProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testType: 'content',
    campaignId: '',
    variantAContent: '',
    variantASubject: '',
    variantBContent: '',
    variantBSubject: '',
    sampleSize: '100',
    startDate: '',
    endDate: '',
  });

  const { data: tests = [], isLoading } = useABTests(workspaceId);
  const { data: campaigns = [] } = useCampaigns(workspaceId);
  const createTest = useCreateABTest(workspaceId);
  const updateTest = useUpdateABTest(workspaceId);
  const deleteTest = useDeleteABTest(workspaceId);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      testType: 'content',
      campaignId: '',
      variantAContent: '',
      variantASubject: '',
      variantBContent: '',
      variantBSubject: '',
      sampleSize: '100',
      startDate: '',
      endDate: '',
    });
    setEditingTest(null);
    setShowCreator(false);
  };

  const handleSubmit = () => {
    const testData = {
      name: formData.name,
      description: formData.description || null,
      test_type: formData.testType,
      campaign_id: formData.campaignId || null,
      variant_a: {
        content: formData.variantAContent,
        subject: formData.variantASubject,
      },
      variant_b: {
        content: formData.variantBContent,
        subject: formData.variantBSubject,
      },
      sample_size: parseInt(formData.sampleSize) || 100,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      status: 'draft',
    };

    if (editingTest) {
      updateTest.mutate({ id: editingTest.id, ...testData }, { onSuccess: resetForm });
    } else {
      createTest.mutate(testData, { onSuccess: resetForm });
    }
  };

  const handleEdit = (test: any) => {
    setEditingTest(test);
    setFormData({
      name: test.name || '',
      description: test.description || '',
      testType: test.test_type || 'content',
      campaignId: test.campaign_id || '',
      variantAContent: test.variant_a?.content || '',
      variantASubject: test.variant_a?.subject || '',
      variantBContent: test.variant_b?.content || '',
      variantBSubject: test.variant_b?.subject || '',
      sampleSize: test.sample_size?.toString() || '100',
      startDate: test.start_date?.split('T')[0] || '',
      endDate: test.end_date?.split('T')[0] || '',
    });
    setShowCreator(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this A/B test?')) {
      deleteTest.mutate(id);
    }
  };

  const handleStatusChange = (test: any, newStatus: string) => {
    updateTest.mutate({ 
      id: test.id, 
      status: newStatus,
      start_date: newStatus === 'running' && !test.start_date ? new Date().toISOString() : test.start_date,
    });
  };

  const handleDeclareWinner = (test: any, winner: 'a' | 'b') => {
    updateTest.mutate({ 
      id: test.id, 
      winner,
      status: 'completed',
      end_date: new Date().toISOString(),
    });
  };

  const activeTests = tests.filter(t => t.status === 'running');
  const draftTests = tests.filter(t => t.status === 'draft');
  const completedTests = tests.filter(t => t.status === 'completed' || t.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing</h2>
          <p className="text-muted-foreground">Create and manage A/B tests for your campaigns</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreator(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New A/B Test
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Play className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTests.length}</p>
                <p className="text-xs text-muted-foreground">Running Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Beaker className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftTests.length}</p>
                <p className="text-xs text-muted-foreground">Draft Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Trophy className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTests.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tests.length}</p>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Creator */}
      {showCreator && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{editingTest ? 'Edit A/B Test' : 'Create New A/B Test'}</CardTitle>
            <CardDescription>Set up your test parameters and variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Homepage CTA Test"
                />
              </div>
              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select 
                  value={formData.testType} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, testType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What are you testing and why?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link to Campaign (Optional)</Label>
                <Select 
                  value={formData.campaignId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, campaignId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sample Size</Label>
                <Input
                  type="number"
                  value={formData.sampleSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, sampleSize: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Variants */}
            <div className="grid grid-cols-2 gap-6">
              {/* Variant A */}
              <Card className="border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      A
                    </div>
                    Variant A
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(formData.testType === 'subject' || formData.testType === 'content') && (
                    <div className="space-y-2">
                      <Label className="text-xs">Subject Line</Label>
                      <Input
                        value={formData.variantASubject}
                        onChange={(e) => setFormData(prev => ({ ...prev, variantASubject: e.target.value }))}
                        placeholder="Your subject line A"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <Textarea
                      value={formData.variantAContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, variantAContent: e.target.value }))}
                      placeholder="Content for variant A..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Variant B */}
              <Card className="border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                      B
                    </div>
                    Variant B
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(formData.testType === 'subject' || formData.testType === 'content') && (
                    <div className="space-y-2">
                      <Label className="text-xs">Subject Line</Label>
                      <Input
                        value={formData.variantBSubject}
                        onChange={(e) => setFormData(prev => ({ ...prev, variantBSubject: e.target.value }))}
                        placeholder="Your subject line B"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <Textarea
                      value={formData.variantBContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, variantBContent: e.target.value }))}
                      placeholder="Content for variant B..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || createTest.isPending || updateTest.isPending}
              >
                {createTest.isPending || updateTest.isPending ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Lists */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Running ({activeTests.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftTests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <TestList
            tests={activeTests}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDeclareWinner={handleDeclareWinner}
            emptyMessage="No running tests"
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <TestList
            tests={draftTests}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDeclareWinner={handleDeclareWinner}
            emptyMessage="No draft tests"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <TestList
            tests={completedTests}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDeclareWinner={handleDeclareWinner}
            emptyMessage="No completed tests"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TestList({
  tests,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onDeclareWinner,
  emptyMessage,
}: {
  tests: any[];
  isLoading: boolean;
  onEdit: (t: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (t: any, status: string) => void;
  onDeclareWinner: (t: any, winner: 'a' | 'b') => void;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {tests.map(test => {
          const progress = test.sample_size > 0 ? (test.current_sample / test.sample_size) * 100 : 0;
          const metricsA = test.variant_a_metrics || { impressions: 0, clicks: 0, conversions: 0 };
          const metricsB = test.variant_b_metrics || { impressions: 0, clicks: 0, conversions: 0 };
          
          return (
            <Card key={test.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge className={statusColors[test.status] || statusColors.draft}>
                        {test.status}
                      </Badge>
                      <Badge variant="outline">{test.test_type}</Badge>
                      {test.winner && (
                        <Badge className="bg-amber-500/20 text-amber-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner: {test.winner.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{test.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {test.status === 'draft' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onStatusChange(test, 'running')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onStatusChange(test, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onEdit(test)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(test.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                {test.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{test.current_sample} / {test.sample_size} samples</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Metrics Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                        A
                      </div>
                      <span className="text-sm font-medium">Variant A</span>
                      {test.winner === 'a' && <Trophy className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="font-medium">{metricsA.impressions}</p>
                        <p className="text-muted-foreground">Impressions</p>
                      </div>
                      <div>
                        <p className="font-medium">{metricsA.clicks}</p>
                        <p className="text-muted-foreground">Clicks</p>
                      </div>
                      <div>
                        <p className="font-medium">{metricsA.conversions}</p>
                        <p className="text-muted-foreground">Conversions</p>
                      </div>
                    </div>
                    {test.status === 'running' && !test.winner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => onDeclareWinner(test, 'a')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Declare Winner
                      </Button>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                        B
                      </div>
                      <span className="text-sm font-medium">Variant B</span>
                      {test.winner === 'b' && <Trophy className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="font-medium">{metricsB.impressions}</p>
                        <p className="text-muted-foreground">Impressions</p>
                      </div>
                      <div>
                        <p className="font-medium">{metricsB.clicks}</p>
                        <p className="text-muted-foreground">Clicks</p>
                      </div>
                      <div>
                        <p className="font-medium">{metricsB.conversions}</p>
                        <p className="text-muted-foreground">Conversions</p>
                      </div>
                    </div>
                    {test.status === 'running' && !test.winner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => onDeclareWinner(test, 'b')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Declare Winner
                      </Button>
                    )}
                  </div>
                </div>

                {/* Confidence Level */}
                {test.confidence_level && (
                  <div className="mt-3 text-xs text-muted-foreground text-center">
                    Statistical confidence: {test.confidence_level}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
