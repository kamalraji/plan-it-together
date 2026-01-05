import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, Mail, MoreHorizontal, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Sponsor {
  id: string;
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  contact: string;
  email: string;
  value: number;
  status: 'active' | 'pending' | 'renewed';
}

const mockSponsors: Sponsor[] = [
  {
    id: '1',
    name: 'TechCorp Global',
    tier: 'platinum',
    contact: 'John Smith',
    email: 'john@techcorp.com',
    value: 50000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Innovation Labs',
    tier: 'gold',
    contact: 'Sarah Johnson',
    email: 'sarah@innovationlabs.com',
    value: 25000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Digital Solutions Inc',
    tier: 'gold',
    contact: 'Mike Wilson',
    email: 'mike@digitalsolutions.com',
    value: 25000,
    status: 'pending',
  },
  {
    id: '4',
    name: 'Cloud Systems',
    tier: 'silver',
    contact: 'Emily Brown',
    email: 'emily@cloudsystems.com',
    value: 10000,
    status: 'renewed',
  },
  {
    id: '5',
    name: 'Data Dynamics',
    tier: 'bronze',
    contact: 'Alex Chen',
    email: 'alex@datadynamics.com',
    value: 5000,
    status: 'active',
  },
];

const tierColors = {
  platinum: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
  gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-black',
  bronze: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
};

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-500',
  pending: 'bg-amber-500/10 text-amber-500',
  renewed: 'bg-blue-500/10 text-blue-500',
};

export function SponsorTracker() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sponsor Directory
          </CardTitle>
          <Button variant="outline" size="sm">
            Add Sponsor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {mockSponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{sponsor.name}</p>
                      <Badge className={`text-xs ${tierColors[sponsor.tier]}`}>
                        {sponsor.tier === 'platinum' && <Star className="h-3 w-3 mr-1" />}
                        {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{sponsor.contact}</span>
                      <span>•</span>
                      <span>${sponsor.value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${statusColors[sponsor.status]}`}>
                    {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
