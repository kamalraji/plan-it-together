import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Leaf, Wheat, Milk, Fish, Nut } from 'lucide-react';

interface DietaryRequirementsTrackerProps {
  workspaceId: string;
}

export function DietaryRequirementsTracker({ workspaceId: _workspaceId }: DietaryRequirementsTrackerProps) {
  // Mock data - would be fetched from registrations in production
  const totalAttendees = 450;
  const dietaryRequirements = [
    { type: 'Vegetarian', count: 85, icon: Leaf, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { type: 'Vegan', count: 32, icon: Leaf, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { type: 'Gluten-Free', count: 28, icon: Wheat, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { type: 'Lactose-Free', count: 22, icon: Milk, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { type: 'Nut Allergy', count: 15, icon: Nut, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { type: 'Seafood Allergy', count: 8, icon: Fish, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  ];

  const specialRequests = [
    { id: '1', name: 'John Smith', requirement: 'Halal', notes: 'Strictly halal certified only' },
    { id: '2', name: 'Sarah Chen', requirement: 'Kosher', notes: 'Kosher certified required' },
    { id: '3', name: 'Mike Brown', requirement: 'Diabetic-friendly', notes: 'Low sugar options' },
  ];

  const totalDietary = dietaryRequirements.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Dietary Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Dietary Requests</span>
            <Badge variant="secondary">{totalDietary} of {totalAttendees}</Badge>
          </div>
          <Progress value={(totalDietary / totalAttendees) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {((totalDietary / totalAttendees) * 100).toFixed(1)}% of attendees have dietary requirements
          </p>
        </div>

        {/* Requirements List */}
        <div className="space-y-2">
          {dietaryRequirements.map((req) => {
            const Icon = req.icon;
            const percentage = (req.count / totalAttendees) * 100;
            return (
              <div key={req.type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${req.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${req.color}`} />
                  </div>
                  <span className="text-sm">{req.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                  <Badge variant="outline" className="text-xs min-w-[40px] justify-center">
                    {req.count}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Special Requests */}
        {specialRequests.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Special Requests ({specialRequests.length})
            </h4>
            <div className="space-y-2">
              {specialRequests.map((request) => (
                <div key={request.id} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{request.name}</span>
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {request.requirement}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{request.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
