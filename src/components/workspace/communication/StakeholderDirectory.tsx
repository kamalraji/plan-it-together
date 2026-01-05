import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Building2, Star, MoreHorizontal } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone?: string;
  category: 'vip' | 'media' | 'sponsor' | 'partner' | 'government';
  priority: 'high' | 'medium' | 'low';
}

const mockStakeholders: Stakeholder[] = [
  {
    id: '1',
    name: 'Dr. Sarah Williams',
    role: 'CEO',
    organization: 'TechCorp Global',
    email: 'sarah@techcorp.com',
    phone: '+1 555-0101',
    category: 'sponsor',
    priority: 'high',
  },
  {
    id: '2',
    name: 'James Mitchell',
    role: 'Editor-in-Chief',
    organization: 'Tech Daily News',
    email: 'james@techdaily.com',
    category: 'media',
    priority: 'high',
  },
  {
    id: '3',
    name: 'Mayor Robert Chen',
    role: 'City Mayor',
    organization: 'City Government',
    email: 'mayor@city.gov',
    phone: '+1 555-0103',
    category: 'government',
    priority: 'high',
  },
  {
    id: '4',
    name: 'Lisa Anderson',
    role: 'Partnerships Director',
    organization: 'Innovation Labs',
    email: 'lisa@innovationlabs.com',
    category: 'partner',
    priority: 'medium',
  },
  {
    id: '5',
    name: 'Michael Brown',
    role: 'VIP Guest',
    organization: 'Venture Capital Inc',
    email: 'michael@vcfirm.com',
    category: 'vip',
    priority: 'high',
  },
  {
    id: '6',
    name: 'Amanda Garcia',
    role: 'Reporter',
    organization: 'Business Weekly',
    email: 'amanda@businessweekly.com',
    category: 'media',
    priority: 'medium',
  },
];

const categoryConfig = {
  vip: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'VIP' },
  media: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Media' },
  sponsor: { color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Sponsor' },
  partner: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Partner' },
  government: { color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Gov' },
};

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-gray-500',
};

export function StakeholderDirectory() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Key Stakeholders
          </CardTitle>
          <Button variant="outline" size="sm">
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-[600px]">
            {mockStakeholders.map((stakeholder) => {
              const config = categoryConfig[stakeholder.category];
              const initials = stakeholder.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              
              return (
                <div
                  key={stakeholder.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${config.bgColor} ${config.color} text-sm font-medium`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{stakeholder.name}</p>
                      {stakeholder.priority === 'high' && (
                        <Star className={`h-3.5 w-3.5 ${priorityColors[stakeholder.priority]} fill-current`} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{stakeholder.role}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{stakeholder.organization}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  <SimpleDropdown>
                    <SimpleDropdownTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 shrink-0 hover:bg-accent hover:text-accent-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </SimpleDropdownTrigger>
                    <SimpleDropdownContent align="end">
                      <SimpleDropdownItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </SimpleDropdownItem>
                      {stakeholder.phone && (
                        <SimpleDropdownItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </SimpleDropdownItem>
                      )}
                    </SimpleDropdownContent>
                  </SimpleDropdown>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
