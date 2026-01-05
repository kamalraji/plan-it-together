import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Coffee, Sun, Moon } from 'lucide-react';

interface MealScheduleProps {
  workspaceId: string;
}

export function MealSchedule({ workspaceId: _workspaceId }: MealScheduleProps) {
  // Mock data - would be fetched from database
  const mealSchedule = [
    {
      id: '1',
      name: 'Breakfast',
      time: '07:30 - 09:00',
      location: 'Main Ballroom Foyer',
      expectedGuests: 380,
      icon: Coffee,
      status: 'upcoming',
      notes: 'Setup starts 06:30',
    },
    {
      id: '2',
      name: 'Morning Tea',
      time: '10:30 - 11:00',
      location: 'Exhibition Hall',
      expectedGuests: 450,
      icon: Coffee,
      status: 'upcoming',
      notes: 'Coffee stations x4',
    },
    {
      id: '3',
      name: 'Lunch',
      time: '12:30 - 14:00',
      location: 'Garden Terrace',
      expectedGuests: 450,
      icon: Sun,
      status: 'upcoming',
      notes: 'Buffet style, outdoor seating available',
    },
    {
      id: '4',
      name: 'Afternoon Tea',
      time: '15:30 - 16:00',
      location: 'Exhibition Hall',
      expectedGuests: 400,
      icon: Coffee,
      status: 'upcoming',
      notes: 'Light snacks and refreshments',
    },
    {
      id: '5',
      name: 'Gala Dinner',
      time: '19:00 - 22:00',
      location: 'Grand Ballroom',
      expectedGuests: 380,
      icon: Moon,
      status: 'upcoming',
      notes: 'Formal seated dinner, 3 courses',
    },
  ];

  const totalServings = mealSchedule.reduce((acc, meal) => acc + meal.expectedGuests, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
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
              const Icon = meal.icon;
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
                              {meal.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {meal.location}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {meal.expectedGuests}
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
