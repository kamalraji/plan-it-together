import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrganization, useIsFollowing, useFollowOrganization, useUnfollowOrganization, useOrganizationEvents } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, MapPin, Globe, Mail, Phone, BadgeCheck, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/looseClient';

interface OrganizationProfileProps {
  organizationId?: string;
}

const categoryLabels = {
  COLLEGE: 'College',
  COMPANY: 'Company',
  INDUSTRY: 'Industry Association',
  NON_PROFIT: 'Non-Profit',
};

export const OrganizationProfile: React.FC<OrganizationProfileProps> = ({ organizationId: propOrgId }) => {
  const { organizationId: paramOrgId } = useParams<{ organizationId: string }>();
  const organizationId = propOrgId || paramOrgId;
  const [user, setUser] = useState<any>(null);

  // Get current user
  supabase.auth.getSession().then(({ data }: any) => {
    setUser(data.session?.user || null);
  });

  const { data: organization, isLoading, error } = useOrganization(organizationId!);
  const { data: events, isLoading: eventsLoading } = useOrganizationEvents(organizationId!, 'PUBLIC');
  const { data: isFollowing, isLoading: followLoading } = useIsFollowing(organizationId!, user?.id || '');

  const followMutation = useFollowOrganization(organizationId!);
  const unfollowMutation = useUnfollowOrganization(organizationId!);

  const handleFollowToggle = () => {
    if (!user) {
      alert('Please log in to follow organizations');
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Organization not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const location = {
    city: organization.city as string | null,
    state: organization.state as string | null,
    country: organization.country as string | null,
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${organization.slug}`
    : `/${organization.slug}`;

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Public link copied to clipboard');
    } catch (_err) {
      // Failed to copy link silently
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative mb-8">
        {organization.banner_url ? (
          <img
            src={organization.banner_url}
            alt={`${organization.name} banner`}
            className="w-full h-40 sm:h-56 md:h-64 object-cover rounded-2xl"
          />
        ) : (
          <div className="w-full h-40 sm:h-56 md:h-64 bg-gradient-to-r from-primary to-primary/70 rounded-2xl" />
        )}

        <div className="absolute left-4 sm:left-8 -bottom-12 sm:-bottom-16">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={`${organization.name} logo`}
              className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg border-4 border-background object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg border-4 border-background bg-muted flex items-center justify-center shadow-lg">
              <Building className="h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Organization Info */}
      <div className="mt-16 sm:mt-20 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{organization.name}</h1>
              {organization.verification_status === 'VERIFIED' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4" />
                  Verified
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <Badge variant="outline">{categoryLabels[organization.category as keyof typeof categoryLabels]}</Badge>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{organization.follower_count} followers</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{events?.length || 0} events</span>
              </div>
            </div>

            {organization.description && (
              <p className="text-muted-foreground max-w-3xl">{organization.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleFollowToggle}
              disabled={followLoading || followMutation.isPending || unfollowMutation.isPending}
              variant={isFollowing ? 'outline' : 'default'}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm hover:bg-muted/80 transition-colors"
            >
              <span className="mr-1 text-xs">🔗</span>
              Copy public link
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-6 mt-6">
          {organization.website && (
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Globe className="h-4 w-4" />
              <span>Website</span>
            </a>
          )}
          {organization.email && (
            <a
              href={`mailto:${organization.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              <span>{organization.email}</span>
            </a>
          )}
          {organization.phone && (
            <a
              href={`tel:${organization.phone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              <span>{organization.phone}</span>
            </a>
          )}
          {location.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{[location.city, location.state, location.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <div className="grid gap-4">
            {eventsLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : events && events.length > 0 ? (
              events.map((event: any) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <Badge>{event.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <Badge variant="outline">{event.mode}</Badge>
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <Button variant="link" className="mt-4 p-0">
                        View Event →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No events available
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {organization.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Category</h4>
                <p className="text-muted-foreground">
                  {categoryLabels[organization.category as keyof typeof categoryLabels]}
                </p>
              </div>

              {organization.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{organization.description}</p>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationProfile;