import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, Mail, MoreHorizontal, Star, Loader2 } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSponsors, type Sponsor, type SponsorTier, type SponsorStatus } from '@/hooks/useSponsors';

interface SponsorTrackerProps {
  workspaceId?: string;
}

const tierColors: Record<SponsorTier, string> = {
  platinum: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
  gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-foreground',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-foreground',
  bronze: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
  partner: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
};

const statusColors: Record<SponsorStatus, string> = {
  prospect: 'bg-muted text-muted-foreground',
  contacted: 'bg-blue-500/10 text-blue-500',
  negotiating: 'bg-amber-500/10 text-amber-500',
  confirmed: 'bg-emerald-500/10 text-emerald-500',
  active: 'bg-emerald-500/10 text-emerald-500',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/10 text-red-500',
};

export function SponsorTracker({ workspaceId }: SponsorTrackerProps) {
  const { data: sponsors = [], isLoading } = useSponsors(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sponsor Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no sponsors
  if (sponsors.length === 0) {
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
        <CardContent className="flex flex-col items-center justify-center h-[320px] text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No sponsors yet</p>
          <p className="text-sm text-muted-foreground/70">Add your first sponsor to get started</p>
        </CardContent>
      </Card>
    );
  }

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
            {sponsors.map((sponsor) => (
              <SponsorRow key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SponsorRow({ sponsor }: { sponsor: Sponsor }) {
  const tierLabel = sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1);
  const statusLabel = sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{sponsor.name}</p>
            <Badge className={`text-xs ${tierColors[sponsor.tier]}`}>
              {sponsor.tier === 'platinum' && <Star className="h-3 w-3 mr-1" />}
              {tierLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{sponsor.contactName || 'No contact'}</span>
            <span>•</span>
            <span>${sponsor.contractValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${statusColors[sponsor.status]}`}>
          {statusLabel}
        </Badge>
        <SimpleDropdown>
          <SimpleDropdownTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </SimpleDropdownTrigger>
          <SimpleDropdownContent align="end">
            <SimpleDropdownItem>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </SimpleDropdownItem>
            <SimpleDropdownItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </SimpleDropdownItem>
          </SimpleDropdownContent>
        </SimpleDropdown>
      </div>
    </div>
  );
}
