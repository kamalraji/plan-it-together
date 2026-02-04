import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EventServiceDashboard } from './EventServiceDashboard';
import { EventListPage } from './EventListPage';
import { EventDetailPage } from './EventDetailPage';
import { EventFormPage } from './EventFormPage';
import { EventOpsConsole } from '@/components/events/EventOpsConsole';
import { VolunteerCheckInInterface } from '@/components/attendance';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '../../../types';

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
      
      {/* Event List Page */}
      <Route path="list" element={<EventListPage />} />
      
      {/* Event Creation */}
      <Route path="create" element={<EventFormPage mode="create" />} />
      
      {/* Event Detail and Edit */}
      <Route path=":eventId" element={<EventDetailPage />} />
      <Route path=":eventId/edit" element={<EventFormPage mode="edit" />} />

      {/* Volunteer Check-in Console */}
      <Route path=":eventId/check-in" element={<EventCheckInRoute />} />
      
      {/* Event Templates */}
      <Route path="templates" element={<EventListPage filterBy="templates" />} />
      
      {/* Event Workspace (event-specific workspace tab) */}
      <Route path=":eventId/workspace" element={<EventDetailPage defaultTab="workspace" />} />
      
      {/* Event Analytics */}
      <Route path=":eventId/analytics" element={<EventDetailPage defaultTab="analytics" />} />

      {/* Event-Day Ops Console */}
      <Route path=":eventId/ops" element={<EventOpsConsole />} />
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/events" replace />} />
    </Routes>
  );
};

const EventCheckInRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isLoading } = useAuth();

  if (!eventId) {
    return <Navigate to="/dashboard" replace />;
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
    return <Navigate to="/dashboard" replace />;
  }

  return <VolunteerCheckInInterface eventId={eventId} />;
};

export default EventService;
