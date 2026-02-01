import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Building2, MapPin, Globe, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  verification_status: string | null;
  website: string | null;
}

interface OrganizationWithEvents extends OrganizationRow {
  eventCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
  }
};

interface OrganizationsListViewProps {
  searchQuery: string;
}

export function OrganizationsListView({ searchQuery }: OrganizationsListViewProps) {
  const { data: organizations, isLoading, error } = useQuery<OrganizationWithEvents[]>({
    queryKey: ['public-organizations-with-events'],
    queryFn: async () => {
      // Fetch all public organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, description, category, logo_url, city, country, verification_status, website')
        .order('name', { ascending: true });

      if (orgsError) throw orgsError;

      // Fetch event counts for each org
      const { data: eventCounts, error: eventError } = await supabase
        .from('events')
        .select('organization_id')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED');

      if (eventError) throw eventError;

      // Count events per organization
      const countMap: Record<string, number> = {};
      (eventCounts || []).forEach((e: { organization_id: string | null }) => {
        if (e.organization_id) {
          countMap[e.organization_id] = (countMap[e.organization_id] || 0) + 1;
        }
      });

      return (orgs as OrganizationRow[]).map((org) => ({
        ...org,
        eventCount: countMap[org.id] || 0,
      }));
    },
  });

  const filteredOrganizations = (organizations || []).filter((org) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.category.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query) ||
      org.city?.toLowerCase().includes(query) ||
      org.country?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-muted rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-muted rounded-lg w-3/4" />
                <div className="h-4 bg-muted rounded-lg w-1/2" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-muted rounded-lg w-full" />
              <div className="h-4 bg-muted rounded-lg w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-8 text-center"
      >
        <p className="text-destructive font-semibold text-lg">Unable to load organizations</p>
        <p className="text-sm text-muted-foreground mt-2">Please check your connection and try again.</p>
      </motion.div>
    );
  }

  if (filteredOrganizations.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 sm:py-20"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center border border-border/50">
          <Building2 className="h-12 w-12 text-muted-foreground/60" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">No organizations found</h2>
        <p className="text-muted-foreground max-w-md mx-auto px-4">
          {searchQuery 
            ? `No organizations match "${searchQuery}". Try a different search term.`
            : 'There are no organizations available at the moment.'}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredOrganizations.length}</span>
          <span className="hidden sm:inline"> organizations found</span>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {filteredOrganizations.map((org) => {
          const isVerified = org.verification_status === 'VERIFIED';
          const location = [org.city, org.country].filter(Boolean).join(', ');

          return (
            <motion.div key={org.id} variants={cardVariants}>
              <Link
                to={`/org/${org.slug}`}
                className="group block h-full bg-card rounded-2xl border-2 border-border/50 overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex gap-4">
                    {/* Logo/Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden group-hover:bg-primary/15 transition-colors">
                        {org.logo_url ? (
                          <img 
                            src={org.logo_url} 
                            alt={org.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-primary" />
                        )}
                      </div>
                    </div>

                    {/* Org Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                          {org.name}
                        </h2>
                        {isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {org.category}
                        </Badge>
                        {location && (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2 flex-grow">
                    {org.description || 'No description available for this organization.'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {org.eventCount} {org.eventCount === 1 ? 'event' : 'events'}
                      </span>
                      {org.website && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}
