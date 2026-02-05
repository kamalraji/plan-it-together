import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Plus, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useSafetyChecklist,
  useInitializeSafetyDefaults,
  useAddSafetyItem,
  useToggleSafetyItem,
} from '@/hooks/useFacilityCommitteeData';

interface SafetyCheckTabProps {
  workspaceId: string;
}

export function SafetyCheckTab({ workspaceId }: SafetyCheckTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const { data: safetyItems, isLoading } = useSafetyChecklist(workspaceId);
  const initializeDefaults = useInitializeSafetyDefaults(workspaceId);
  const addItem = useAddSafetyItem(workspaceId);
  const toggleItem = useToggleSafetyItem(workspaceId);

  const completedCount = safetyItems?.filter(i => i.status === 'DONE').length || 0;
  const totalCount = safetyItems?.length || 0;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    addItem.mutate(newItemTitle.trim(), {
      onSuccess: () => {
        setNewItemTitle('');
        setIsAdding(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{totalCount - completedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Progress</p>
                <span className="text-sm font-medium">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Checklist Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Safety Checklist
          </CardTitle>
          <div className="flex gap-2">
            {totalCount === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => initializeDefaults.mutate()}
                disabled={initializeDefaults.isPending}
              >
                {initializeDefaults.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Load Defaults
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Item Form */}
          {isAdding && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter safety check item..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button 
                onClick={handleAddItem} 
                disabled={!newItemTitle.trim() || addItem.isPending}
              >
                {addItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Empty State */}
          {totalCount === 0 && !isAdding && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
              <h3 className="text-lg font-medium mb-2">No safety items</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Load default safety items or add custom ones.
              </p>
              <Button onClick={() => initializeDefaults.mutate()} disabled={initializeDefaults.isPending}>
                {initializeDefaults.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Load Default Checklist
              </Button>
            </div>
          )}

          {/* Checklist Items */}
          {totalCount > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {safetyItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.status === 'DONE'}
                      onCheckedChange={() => toggleItem.mutate({ id: item.id, currentStatus: item.status })}
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex-1 text-sm cursor-pointer ${
                        item.status === 'DONE' ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.title}
                    </label>
                    <Badge 
                      variant={item.status === 'DONE' ? 'default' : 'outline'}
                      className={item.status === 'DONE' ? 'bg-emerald-500' : ''}
                    >
                      {item.status === 'DONE' ? 'Complete' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
