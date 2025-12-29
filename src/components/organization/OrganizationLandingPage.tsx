import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationProfile } from '@/components/organization/OrganizationProfile';


type OrganizationRow = Tables<'organizations'>;

export const OrganizationLandingPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgSlug) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .maybeSingle();

      if (error) {
        console.error('Error loading organization by slug', error);
        setError('Unable to load organization');
      } else if (!data) {
        setError('Organization not found');
      } else {
        setOrganization(data as OrganizationRow);
        try {
          document.title = `${data.name} | Thittam1Hub`;

          const description =
            data.description ||
            `Discover events and updates from ${data.name} on Thittam1Hub.`;

          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'description');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', description);

          let canonical = document.querySelector('link[rel="canonical"]');
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
          }
          canonical.setAttribute(
            'href',
            `${window.location.origin}/${data.slug}`,
          );
        } catch (seoError) {
          console.warn('Unable to set SEO metadata for organization page', seoError);
        }
      }

      setIsLoading(false);
    };

    fetchOrganization();
  }, [orgSlug]);

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
          <CardHeader>
            <CardTitle>Organization not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t find an organization for this URL. Please check the link or
              contact the organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OrganizationProfile organizationId={organization.id} />;
};
