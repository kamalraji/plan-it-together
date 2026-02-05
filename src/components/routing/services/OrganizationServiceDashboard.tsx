import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Plus, 
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * OrganizationServiceDashboard - Modern, stylish organization management hub
 */
export const OrganizationServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const {
    organizations,
    managedOrganizations,
    recentOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
  } = useOrganizerOrganizations();

  // Use URL param org slug or fallback to first organization
  const currentOrgSlug = orgSlug || (organizations && organizations.length > 0 ? organizations[0].slug : null);
  
  const getOrgPath = (path: string) => currentOrgSlug ? `/${currentOrgSlug}${path}` : '/dashboard';

  // Calculate totals
  const totalEvents = Object.values(perOrgAnalytics).reduce((acc, a) => acc + (a.totalEvents || 0), 0);
  const totalMembers = recentOrganizations.reduce((acc, o) => acc + (o.memberCount || 0), 0);

  if (isLoadingOrganizations && !organizations) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Skeleton Hero */}
          <div className="h-48 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl animate-pulse" />
          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-8 md:p-10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Organization Hub</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Manage Your Organizations
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Oversee teams, track analytics, and configure settings across all your organizations from one central dashboard.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate(getOrgPath('/organizations/list'))}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View All
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/organizations/create')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Organizations', value: organizations?.length || 0, icon: Building2, color: 'text-primary' },
            { label: 'Total Events', value: totalEvents, icon: Calendar, color: 'text-secondary-foreground' },
            { label: 'Team Members', value: totalMembers, icon: Users, color: 'text-accent-foreground' },
            { label: 'Active Now', value: managedOrganizations.length, icon: TrendingUp, color: 'text-primary' },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="group relative bg-card hover:bg-card/80 rounded-2xl border border-border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-xl bg-primary/10 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              title: 'Team Management',
              description: 'Invite members, assign roles, and manage permissions',
              icon: Users,
              path: getOrgPath('/team'),
              gradient: 'from-blue-500/10 to-cyan-500/10',
              iconBg: 'bg-info/10 text-info'
            },
            {
              title: 'Organization Settings',
              description: 'Configure branding, policies, and preferences',
              icon: Settings,
              path: getOrgPath('/settings'),
              gradient: 'from-purple-500/10 to-pink-500/10',
              iconBg: 'bg-primary/10 text-primary'
            },
            {
              title: 'Analytics & Insights',
              description: 'Track growth, engagement, and performance metrics',
              icon: BarChart3,
              path: getOrgPath('/analytics'),
              gradient: 'from-emerald-500/10 to-teal-500/10',
              iconBg: 'bg-emerald-500/10 text-emerald-600'
            },
          ].map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="group relative overflow-hidden bg-card hover:bg-card/80 rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl ${action.iconBg} mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  {action.title}
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Empty State */}
        {recentOrganizations.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 px-6 bg-card rounded-3xl border border-border"
          >
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Organizations Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first organization to start managing teams, events, and more.
            </p>
            <Button onClick={() => navigate('/organizations/create')} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </motion.div>
        )}

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl p-6 md:p-8"
        >
          <div className="flex items-center gap-2 text-primary mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Features</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Everything You Need</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Member Management',
                description: 'Invite, manage, and assign roles with granular permissions control.',
              },
              {
                title: 'Branding & Settings',
                description: 'Customize your organization\'s appearance and configure policies.',
              },
              {
                title: 'Analytics & Reports',
                description: 'Track growth, member activity, and event performance metrics.',
              },
            ].map((feature) => (
              <div key={feature.title} className="space-y-2">
                <h4 className="font-medium text-foreground">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrganizationServiceDashboard;
