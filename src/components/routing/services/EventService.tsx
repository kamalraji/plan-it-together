import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EventServiceDashboard } from './EventServiceDashboard';
import { EventListPage } from './EventListPage';
import { EventDetailPage } from './EventDetailPage';
import { EventFormPage } from './EventFormPage';
import { EventOpsConsole } from '@/components/events/EventOpsConsole';
import { EventPageBuilder } from '@/components/events/EventPageBuilder';
import { VolunteerCheckInInterface } from '@/components/attendance';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '../../../types';
import { RequireEventAccess } from './RequireEventAccess';
import { EventAnalyticsPage } from './EventAnalyticsPage';
import { EventRegistrationsOverviewPage } from './EventRegistrationsOverviewPage';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';

/**
 * EventService component provides the main routing structure for the Event Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page)
 * - Resource list view (events list)
 * - Resource detail view (event details)
 * - Resource creation/editing (event form)
 */
export const EventService: React.FC = () => {
  return (
    <Routes>
      {/* Service Dashboard - default route */}
      <Route index element={<EventServiceDashboard />} />

      {/* Registrations Overview */}
      <Route path="registrations" element={<EventRegistrationsOverviewPage />} />

      {/* Event List Page */}
      <Route path="list" element={<EventListPage />} />
      {/* Event Creation */}
      <Route path="create" element={<EventFormPage mode="create" />} />

      {/* Event Detail and Edit (guarded by ownership/access) */}
      <Route
        path=":eventId"
        element={
          <EventAccessRoute>
            <EventDetailPage />
          </EventAccessRoute>
        }
      />
      <Route
        path=":eventId/edit"
        element={
          <EventAccessRoute requireManage>
            <EventFormPage mode="edit" />
          </EventAccessRoute>
        }
      />

      {/* Volunteer Check-in Console (uses existing role-based guard) */}
      <Route path=":eventId/check-in" element={<EventCheckInRoute />} />

      {/* Event Templates */}
      <Route path="templates" element={<EventListPage filterBy="templates" />} />

      {/* Event Workspace and Analytics tabs (require manage access) */}
      <Route
        path=":eventId/workspace"
        element={
          <EventAccessRoute requireManage>
            <EventDetailPage defaultTab="workspace" />
          </EventAccessRoute>
        }
      />
      <Route
        path=":eventId/analytics"
        element={
          <EventAccessRoute requireManage>
            <EventAnalyticsPage />
          </EventAccessRoute>
        }
      />

      {/* Event-Day Ops Console (require manage access) */}
      <Route
        path=":eventId/ops"
        element={
          <EventAccessRoute requireManage>
            <EventOpsConsole />
          </EventAccessRoute>
        }
      />

      {/* Event landing page builder (require manage access) */}
      <Route
        path=":eventId/page-builder"
        element={
          <EventAccessRoute requireManage>
            <EventPageBuilder />
          </EventAccessRoute>
        }
      />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/events" replace />} />
    </Routes>
  );
};
/**
 * Wrapper route that reads :eventId from params and delegates to RequireEventAccess.
 */
const EventAccessRoute: React.FC<{ requireManage?: boolean; children: React.ReactNode }> = ({
  requireManage,
  children,
}) => {
  const { eventId } = useParams<{ eventId: string }>();
  return (
    <RequireEventAccess eventId={eventId} requireManage={requireManage}>
      {children}
    </RequireEventAccess>
  );
};

const EventCheckInRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isLoading } = useAuth();
  const { data: primaryOrg } = usePrimaryOrganization();
  
  const dashboardPath = primaryOrg?.slug ? `/${primaryOrg.slug}/dashboard` : '/dashboard';

  if (!eventId) {
    return <Navigate to={dashboardPath} replace />;
  }

  if (isLoading) {
    return null;
  }

  const hasAccess =
    user &&
    (user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ORGANIZER ||
      user.role === UserRole.VOLUNTEER);

  if (!hasAccess) {
    return <Navigate to={dashboardPath} replace />;
  }

  return <VolunteerCheckInInterface eventId={eventId} />;
};
