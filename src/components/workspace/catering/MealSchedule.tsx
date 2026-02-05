import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Coffee, Sun, Moon, Loader2 } from 'lucide-react';
import { useCateringMealSchedule } from '@/hooks/useCateringData';

interface MealScheduleProps {
  workspaceId: string;
}

export function MealSchedule({ workspaceId }: MealScheduleProps) {
  const { data: mealSchedule = [], isLoading } = useCateringMealSchedule(workspaceId);

  const mealTypeIcons = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
    snack: Coffee,
    tea: Coffee,
  };

  const totalServings = mealSchedule.reduce((acc, meal) => acc + meal.expected_guests, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            Meal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (mealSchedule.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            Meal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No meals scheduled yet. Add meals from the database.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            Meal Schedule
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {totalServings.toLocaleString()} total servings
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {mealSchedule.map((meal) => {
              const Icon = mealTypeIcons[meal.meal_type] || Coffee;
              return (
                <div key={meal.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-orange-500/30">
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{meal.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {meal.scheduled_time}
                            </span>
                            {meal.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {meal.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {meal.expected_guests}
                        </Badge>
                      </div>
                      {meal.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {meal.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
