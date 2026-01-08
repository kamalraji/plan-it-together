import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Calendar, Briefcase, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationSlug: string;
}

type SearchCategory = 'all' | 'events' | 'workspaces' | 'members';

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationSlug,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ['search-events', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, status, mode')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch workspaces with hierarchy data
  const { data: workspaces = [] } = useQuery({
    queryKey: ['search-workspaces', organizationId],
    queryFn: async () => {
      const { data: orgEvents } = await supabase
        .from('events')
        .select('id, name, slug')
        .eq('organization_id', organizationId);
      
      if (!orgEvents?.length) return [];
      
      const eventIds = orgEvents.map(e => e.id);
      const eventMap = new Map(orgEvents.map(e => [e.id, e]));
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, status, event_id, created_at, workspace_type, parent_workspace_id')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      
      return (data || []).map(ws => ({
        ...ws,
        event: eventMap.get(ws.event_id),
      }));
    },
    enabled: isOpen,
  });

  // Fetch team members
  const { data: members = [] } = useQuery({
    queryKey: ['search-members', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          role,
          status,
          user_id
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .limit(50);
      
      if (error) throw error;
      
      // Get user profiles for members
      if (data?.length) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, organization')
          .in('id', userIds);
        
        return data.map(member => ({
          ...member,
          profile: profiles?.find(p => p.id === member.user_id),
        }));
      }
      
      return [];
    },
    enabled: isOpen,
  });

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filteredEvents = events.filter(e => 
      e.name.toLowerCase().includes(query)
    );
    
    const filteredWorkspaces = workspaces.filter(w => 
      w.name.toLowerCase().includes(query)
    );
    
    const filteredMembers = members.filter(m => 
      m.profile?.full_name?.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );

    return {
      events: activeCategory === 'all' || activeCategory === 'events' ? filteredEvents : [],
      workspaces: activeCategory === 'all' || activeCategory === 'workspaces' ? filteredWorkspaces : [],
      members: activeCategory === 'all' || activeCategory === 'members' ? filteredMembers : [],
    };
  }, [searchQuery, events, workspaces, members, activeCategory]);

  const totalResults = 
    filteredResults.events.length + 
    filteredResults.workspaces.length + 
    filteredResults.members.length;

  const categories: { id: SearchCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalResults },
    { id: 'events', label: 'Events', count: filteredResults.events.length },
    { id: 'workspaces', label: 'Workspaces', count: filteredResults.workspaces.length },
    { id: 'members', label: 'Members', count: filteredResults.members.length },
  ];

  const handleEventClick = (eventId: string) => {
    onClose();
    navigate(`/${organizationSlug}/eventmanagement/${eventId}`);
  };

  const handleWorkspaceClick = (workspace: any) => {
    onClose();
    // Build hierarchy for the workspace
    const workspaceDataForHierarchy = workspaces.map(ws => ({
      id: ws.id,
      slug: ws.slug || slugify(ws.name),
      name: ws.name,
      workspaceType: ws.workspace_type || null,
      parentWorkspaceId: ws.parent_workspace_id,
    }));
    
    const hierarchy = buildHierarchyChain(workspace.id, workspaceDataForHierarchy);
    const eventSlug = workspace.event?.slug || slugify(workspace.event?.name || '');
    
    const url = buildWorkspaceUrl({
      orgSlug: organizationSlug,
      eventSlug,
      eventId: workspace.event_id,
      hierarchy,
    });
    navigate(url);
  };

  const handleMemberClick = () => {
    onClose();
    navigate(`/${organizationSlug}/team`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center gap-3 px-4 py-3 safe-area-pt">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search events, workspaces, members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                  <span className={cn(
                    "text-xs",
                    activeCategory === cat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Events Section */}
            {filteredResults.events.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Events
                </h3>
                <div className="space-y-2">
                  {filteredResults.events.slice(0, activeCategory === 'events' ? 20 : 5).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {event.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Workspaces Section */}
            {filteredResults.workspaces.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" />
                  Workspaces
                </h3>
                <div className="space-y-2">
                  {filteredResults.workspaces.slice(0, activeCategory === 'workspaces' ? 20 : 5).map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceClick(workspace)}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {workspace.status}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Members Section */}
            {filteredResults.members.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Team Members
                </h3>
                <div className="space-y-2">
                  {filteredResults.members.slice(0, activeCategory === 'members' ? 20 : 5).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleMemberClick()}
                      className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.profile?.avatar_url ? (
                          <img 
                            src={member.profile.avatar_url} 
                            alt="" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.profile?.full_name || 'Unknown Member'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role.toLowerCase()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {totalResults === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Start typing to search</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Find events, workspaces, and team members
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
