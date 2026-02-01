import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useEventManagementMetrics, DashboardEventRow } from '@/hooks/useEventManagementMetrics';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { useOptionalOrganization } from '@/components/organization/OrganizationContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Plus,
  Users,
  Eye,
  Pencil,
  ExternalLink,
  LayoutTemplate,
  ChevronRight,
  Sparkles,
  CalendarDays,
  TrendingUp,
  Clock,
} from 'lucide-react';

/**
 * EventServiceDashboard provides a modern, stylish service landing page for Event Management.
 */
export const EventServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const organization = useOptionalOrganization();
  const [onlyMine, setOnlyMine] = useState(false);
  const { createPath, listPath, eventDetailPath, eventEditPath } = useEventManagementPaths();

  useEffect(() => {
    document.title = 'Event Management Dashboard | Thittam1Hub';
  }, []);

  const { events, registrationsByEvent } = useEventManagementMetrics(organization?.id, onlyMine);

  const totalEvents = events?.length ?? 0;
  const totalRegistrations = Object.values(registrationsByEvent ?? {}).reduce((a, b) => a + b, 0);
  const publishedEvents = events?.filter((e) => e.status === 'PUBLISHED').length ?? 0;
  const draftEvents = events?.filter((e) => e.status === 'DRAFT').length ?? 0;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return { 
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
          text: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          pulse: true 
        };
      case 'DRAFT':
        return { 
          bg: 'bg-amber-500/10 dark:bg-amber-500/20', 
          text: 'text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
          pulse: false 
        };
      case 'ONGOING':
        return { 
          bg: 'bg-sky-500/10 dark:bg-sky-500/20', 
          text: 'text-sky-600 dark:text-sky-400',
          dot: 'bg-sky-500',
          pulse: true 
        };
      default:
        return { 
          bg: 'bg-muted', 
          text: 'text-muted-foreground',
          dot: 'bg-muted-foreground',
          pulse: false 
        };
    }
  };

  return (
    <OrgPageWrapper>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Event Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Create & Manage Events
              </h1>
              <p className="text-muted-foreground max-w-lg">
                Design memorable experiences, track registrations, and analyze your event performance.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate(createPath)}
              size="lg"
              className="group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: totalEvents, icon: Calendar, color: 'text-primary' },
            { label: 'Published', value: publishedEvents, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Drafts', value: draftEvents, icon: Clock, color: 'text-amber-500' },
            { label: 'Registrations', value: totalRegistrations, icon: Users, color: 'text-sky-500' },
          ].map((stat, i) => (
            <div 
              key={stat.label}
              className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ownership Toggle */}
        {organization?.id && (
          <div className="flex items-center gap-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 p-4">
            <Switch
              id="only-mine-toggle"
              checked={onlyMine}
              onCheckedChange={setOnlyMine}
            />
            <Label htmlFor="only-mine-toggle" className="text-sm text-muted-foreground cursor-pointer">
              Show only events I created
            </Label>
          </div>
        )}

        {/* Recent Events Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
            </div>
            <Link
              to={listPath}
              className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Events Grid */}
          {(events ?? []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(events ?? []).slice(0, 6).map((event: DashboardEventRow, i) => {
                const statusConfig = getStatusConfig(event.status);
                const registrations = registrationsByEvent?.[event.id] ?? 0;
                
                return (
                  <div
                    key={event.id}
                    className="group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.start_date 
                              ? new Date(event.start_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Date not set'
                            }
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-medium ${statusConfig.text}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>

                      {/* Registration count */}
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{registrations}</span>
                        <span className="text-muted-foreground">registrations</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                        <Link
                          to={eventDetailPath(event.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <Link
                          to={eventEditPath(event.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <Link
                          to={`/events/${event.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          to={listPath.replace(/\/list$/, `/${event.id}/page-builder`)}
                          className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <LayoutTemplate className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl bg-card/50 border border-dashed border-border">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first event and start managing registrations.
              </p>
              <Button onClick={() => navigate(createPath)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              title: 'Event Creation', 
              desc: 'Create events with customizable templates and branding.',
              icon: Plus,
              action: () => navigate(createPath),
              btnText: 'Create Event'
            },
            { 
              title: 'Registration Hub', 
              desc: 'Manage participant registration and communication.',
              icon: Users,
              action: () => navigate(listPath.replace('/list', '/registrations')),
              btnText: 'View Registrations'
            },
            { 
              title: 'All Events', 
              desc: 'Browse and manage all your events in one place.',
              icon: Calendar,
              action: () => navigate(listPath),
              btnText: 'View All Events'
            },
          ].map((item) => (
            <div 
              key={item.title}
              className="group rounded-xl bg-gradient-to-br from-card to-card/50 border border-border/50 p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={item.action}
                    className="group/btn p-0 h-auto font-medium text-primary hover:text-primary/80 hover:bg-transparent"
                  >
                    {item.btnText}
                    <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </OrgPageWrapper>
  );
};
