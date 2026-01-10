import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Settings,
  Building2,
  Activity,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { AdminStatisticsPanel } from './AdminStatisticsPanel';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminSystemSettings } from './AdminSystemSettings';
import { VendorApprovalPanel } from './VendorApprovalPanel';
import { AdminActivityDashboard } from './AdminActivityDashboard';
import { SecurityAuditDashboard } from './SecurityAuditDashboard';

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, vendors, system settings, and monitor platform health.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2 data-[state=active]:bg-background">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <AdminStatisticsPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6 mt-6">
          <VendorApprovalPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <AdminSystemSettings />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <AdminActivityDashboard />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <SecurityAuditDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
