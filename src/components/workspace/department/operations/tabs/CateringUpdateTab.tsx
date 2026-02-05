import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Clock, MapPin, Users, Loader2, AlertCircle, Leaf, Wheat } from 'lucide-react';
import {
  useCateringMealSchedule,
  useCateringMenuItems,
  useDietaryRequirements,
} from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';

interface CateringUpdateTabProps {
  workspace: Workspace;
}

export function CateringUpdateTab({ workspace }: CateringUpdateTabProps) {
  const { data: meals, isLoading: mealsLoading } = useCateringMealSchedule(workspace.id);
  const { data: menuItems, isLoading: menuLoading } = useCateringMenuItems(workspace.id);
  const { data: dietaryReqs, isLoading: dietaryLoading } = useDietaryRequirements(workspace.eventId);

  const isLoading = mealsLoading || menuLoading || dietaryLoading;

  const getMealTypeIcon = (_mealType?: string) => {
    return <UtensilsCrossed className="h-4 w-4" />;
  };

  const getDietaryIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('vegan') || lowerType.includes('vegetarian')) {
      return <Leaf className="h-4 w-4 text-success" />;
    }
    if (lowerType.includes('gluten')) {
      return <Wheat className="h-4 w-4 text-warning" />;
    }
    return <AlertCircle className="h-4 w-4 text-warning" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalGuests = meals?.reduce((sum, meal) => sum + (meal.expected_guests || 0), 0) || 0;
  const totalDietaryReqs = dietaryReqs?.reduce((sum, req) => sum + (req.count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Catering Update</h2>
        <p className="text-muted-foreground">Meal schedules and dietary requirements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/20 rounded-full">
                <UtensilsCrossed className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{meals?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Meal Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/20 rounded-full">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{totalGuests}</div>
                <p className="text-sm text-muted-foreground">Expected Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/20 rounded-full">
                <Leaf className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{totalDietaryReqs}</div>
                <p className="text-sm text-muted-foreground">Dietary Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Meal Schedule</TabsTrigger>
          <TabsTrigger value="dietary">Dietary Requirements</TabsTrigger>
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Meal Schedule</CardTitle>
              <CardDescription>Scheduled meal services for the event</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {meals && meals.length > 0 ? (
                  <div className="space-y-4">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            {getMealTypeIcon(meal.meal_type)}
                            <div>
                              <h4 className="font-semibold text-foreground">{meal.name}</h4>
                              <Badge variant="outline" className="mt-1">{meal.meal_type}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(meal.scheduled_time), 'h:mm a')}
                          </span>
                          {meal.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {meal.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {meal.expected_guests} guests
                          </span>
                        </div>
                        {meal.notes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">{meal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No meal services scheduled</p>
                    <p className="text-sm">Meal schedules will appear here once configured</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dietary">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Dietary Requirements</CardTitle>
              <CardDescription>Special dietary needs for attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {dietaryReqs && dietaryReqs.length > 0 ? (
                  <div className="space-y-4">
                    {dietaryReqs.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDietaryIcon(req.requirement_type)}
                            <div>
                              <h4 className="font-semibold text-foreground">{req.requirement_type}</h4>
                            </div>
                          </div>
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {req.count} {req.count === 1 ? 'request' : 'requests'}
                          </Badge>
                        </div>
                        {req.special_requests && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {JSON.stringify(req.special_requests)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No dietary requirements recorded</p>
                    <p className="text-sm">Dietary requirements will appear here from registrations</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Menu Items</CardTitle>
              <CardDescription>Available menu items for the event</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {menuItems && menuItems.length > 0 ? (
                  <div className="space-y-4">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">{item.meal_type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.is_vegetarian && (
                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegetarian
                            </Badge>
                          )}
                          {item.is_vegan && (
                            <Badge className="bg-success/20 text-success border-success/30 text-xs">
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegan
                            </Badge>
                          )}
                          {item.is_gluten_free && (
                            <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                              <Wheat className="h-3 w-3 mr-1" />
                              Gluten-Free
                            </Badge>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {item.allergens.join(', ')}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Servings: {item.servings}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No menu items configured</p>
                    <p className="text-sm">Menu items will appear here once added</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
