import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Users, Building2, Briefcase, Award, UserCheck, Mic } from 'lucide-react';

/**
 * Admin Roles Diagram Page
 * Displays the role model and access matrix for the application
 */
const AdminRolesDiagramPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/user-roles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Roles
            </Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Role Model & Access Matrix
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visual overview of how roles work across the application's database and backend systems.
          </p>
        </div>

        {/* Global App Roles Section */}
        <Card className="shadow-soft border-coral/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-coral" />
              Global App Roles (Supabase enum: public.app_role)
            </CardTitle>
            <CardDescription>
              These roles are stored in the <code className="text-xs bg-muted px-1 py-0.5 rounded">user_roles</code> table and checked via the <code className="text-xs bg-muted px-1 py-0.5 rounded">has_role()</code> function.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { role: 'admin', icon: Shield, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                { role: 'organizer', icon: Briefcase, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                { role: 'participant', icon: Users, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
                { role: 'judge', icon: Award, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
                { role: 'volunteer', icon: UserCheck, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
                { role: 'speaker', icon: Mic, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
              ].map(({ role, icon: Icon, color }) => (
                <div key={role} className={`flex flex-col items-center p-4 rounded-lg ${color}`}>
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="font-medium text-sm">{role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Organization Roles Section */}
        <Card className="shadow-soft border-teal/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal" />
              Organization Membership Roles
            </CardTitle>
            <CardDescription>
              Stored in <code className="text-xs bg-muted px-1 py-0.5 rounded">organization_memberships</code> table. Checked via <code className="text-xs bg-muted px-1 py-0.5 rounded">is_org_admin_for_org()</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { role: 'OWNER', desc: 'Full control, can delete org', level: 'Critical' },
                { role: 'ADMIN', desc: 'Manage members & settings', level: 'High' },
                { role: 'ORGANIZER', desc: 'Create & manage events', level: 'Medium' },
                { role: 'VIEWER', desc: 'Read-only access', level: 'Low' },
              ].map(({ role, desc, level }) => (
                <div key={role} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{role}</span>
                    <Badge variant={level === 'Critical' ? 'destructive' : level === 'High' ? 'default' : 'secondary'}>
                      {level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Access Matrix */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Access Matrix</CardTitle>
            <CardDescription>
              Which roles can access which features via RLS policies
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Resource</th>
                  <th className="text-center p-2 font-medium">admin</th>
                  <th className="text-center p-2 font-medium">organizer</th>
                  <th className="text-center p-2 font-medium">participant</th>
                  <th className="text-center p-2 font-medium">judge</th>
                  <th className="text-center p-2 font-medium">volunteer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { resource: 'events', admin: '✓', organizer: '✓', participant: 'R', judge: 'R', volunteer: 'R' },
                  { resource: 'registrations', admin: '✓', organizer: '✓', participant: 'Own', judge: 'R', volunteer: '✓' },
                  { resource: 'submissions', admin: '✓', organizer: '✓', participant: 'Own', judge: '✓', volunteer: '-' },
                  { resource: 'scores', admin: '✓', organizer: 'R', participant: '-', judge: 'Own', volunteer: '-' },
                  { resource: 'workspaces', admin: '✓', organizer: '✓', participant: '-', judge: '-', volunteer: '✓' },
                  { resource: 'certificates', admin: '✓', organizer: '✓', participant: 'Own', judge: 'Own', volunteer: 'Own' },
                  { resource: 'user_profiles', admin: '✓', organizer: 'R', participant: 'Own', judge: 'Own', volunteer: 'Own' },
                  { resource: 'organizations', admin: '✓', organizer: '✓*', participant: 'R', judge: 'R', volunteer: 'R' },
                ].map(({ resource, ...perms }) => (
                  <tr key={resource} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{resource}</td>
                    {Object.values(perms).map((perm, i) => (
                      <td key={i} className="text-center p-2">
                        <span className={
                          perm === '✓' ? 'text-green-600' :
                          perm === 'Own' ? 'text-blue-600' :
                          perm === 'R' ? 'text-yellow-600' :
                          perm === '-' ? 'text-muted-foreground' :
                          'text-foreground'
                        }>
                          {perm}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span><span className="text-green-600 font-semibold">✓</span> = Full CRUD</span>
              <span><span className="text-blue-600 font-semibold">Own</span> = Own records only</span>
              <span><span className="text-yellow-600 font-semibold">R</span> = Read only</span>
              <span><span className="text-muted-foreground font-semibold">-</span> = No access</span>
              <span><span className="font-semibold">*</span> = Via org membership</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Functions */}
        <Card className="shadow-soft border-sunny/20">
          <CardHeader>
            <CardTitle>Key Security Functions</CardTitle>
            <CardDescription>
              Database functions used for RLS policy checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: 'has_role(user_id, app_role)',
                  desc: 'Checks if a user has a specific global app role. Used in most RLS policies.',
                  type: 'SECURITY DEFINER',
                },
                {
                  name: 'is_org_admin_for_org(org_id)',
                  desc: 'Checks if current user is OWNER or ADMIN for an organization.',
                  type: 'SECURITY DEFINER',
                },
                {
                  name: 'approve_organizer_application(app_id)',
                  desc: 'Approves an organizer application and grants the organizer role.',
                  type: 'SECURITY DEFINER',
                },
              ].map(({ name, desc, type }) => (
                <div key={name} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{name}</code>
                    <Badge variant="outline">{type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            For the full Mermaid diagram, see{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">docs/role-model-diagram.md</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRolesDiagramPage;
