import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Clock, Users, Leaf, AlertTriangle } from 'lucide-react';

interface CateringUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MealSchedule {
  time: string;
  meal: string;
  location: string;
  guests: number;
  status: 'served' | 'preparing' | 'scheduled';
  menuItems: string[];
}

interface DietaryRequirement {
  type: string;
  count: number;
  notes: string;
}

export function CateringUpdateModal({ open, onOpenChange }: CateringUpdateModalProps) {
  const [meals] = useState<MealSchedule[]>([
    { 
      time: '08:00', 
      meal: 'Breakfast', 
      location: 'Lobby Lounge', 
      guests: 150, 
      status: 'served',
      menuItems: ['Continental Breakfast', 'Fresh Fruits', 'Coffee & Tea']
    },
    { 
      time: '10:30', 
      meal: 'Morning Break', 
      location: 'Foyer', 
      guests: 200, 
      status: 'preparing',
      menuItems: ['Pastries', 'Fresh Juice', 'Coffee']
    },
    { 
      time: '12:30', 
      meal: 'Lunch', 
      location: 'Dining Hall', 
      guests: 250, 
      status: 'scheduled',
      menuItems: ['Buffet Lunch', 'Salad Bar', 'Dessert Station']
    },
    { 
      time: '15:30', 
      meal: 'Afternoon Break', 
      location: 'Foyer', 
      guests: 200, 
      status: 'scheduled',
      menuItems: ['Tea & Cookies', 'Light Snacks']
    },
    { 
      time: '19:00', 
      meal: 'Gala Dinner', 
      location: 'Grand Ballroom', 
      guests: 300, 
      status: 'scheduled',
      menuItems: ['3-Course Dinner', 'Wine Pairing', 'Live Station']
    },
  ]);

  const [dietaryReqs] = useState<DietaryRequirement[]>([
    { type: 'Vegetarian', count: 45, notes: 'Separate prep area confirmed' },
    { type: 'Vegan', count: 22, notes: 'Plant-based options ready' },
    { type: 'Gluten-Free', count: 18, notes: 'Dedicated GF menu available' },
    { type: 'Halal', count: 15, notes: 'Certified halal items sourced' },
    { type: 'Nut Allergy', count: 8, notes: 'Nut-free kitchen zone designated' },
    { type: 'Dairy-Free', count: 12, notes: 'Alternative milks available' },
  ]);

  const getStatusBadge = (status: MealSchedule['status']) => {
    switch (status) {
      case 'served':
        return <Badge className="bg-success/10 text-success">Served</Badge>;
      case 'preparing':
        return <Badge className="bg-warning/10 text-warning">Preparing</Badge>;
      case 'scheduled':
        return <Badge className="bg-info/10 text-info">Scheduled</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-warning" />
            Catering Update - Meal Schedules
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Meal Schedule</TabsTrigger>
            <TabsTrigger value="dietary">Dietary Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <ScrollArea className="h-[380px] pr-4">
              <div className="space-y-3 pt-4">
                {meals.map((meal, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{meal.time} - {meal.meal}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{meal.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {meal.guests}
                        </div>
                        {getStatusBadge(meal.status)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {meal.menuItems.map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dietary">
            <ScrollArea className="h-[380px] pr-4">
              <div className="space-y-3 pt-4">
                {dietaryReqs.map((req, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{req.type}</p>
                        <p className="text-sm text-muted-foreground">{req.notes}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg font-semibold">
                      {req.count}
                    </Badge>
                  </div>
                ))}
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Reminder: Confirm final dietary counts 2 hours before each meal</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
