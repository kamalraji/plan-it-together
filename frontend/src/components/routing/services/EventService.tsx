import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EventServiceDashboard } from './EventServiceDashboard';
import { EventListPage } from './EventListPage';
import { EventDetailPage } from './EventDetailPage';
import { EventFormPage } from './EventFormPage';

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
      
      {/* Event Templates */}
      <Route path="templates" element={<EventListPage filterBy="templates" />} />
      
      {/* Event Analytics */}
      <Route path=":eventId/analytics" element={<EventDetailPage defaultTab="analytics" />} />
      
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/events" replace />} />
    </Routes>
  );
};

export default EventService;
