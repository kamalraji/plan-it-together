import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { EmailVerification } from './components/auth/EmailVerification';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OrganizerDashboard } from './components/dashboard/OrganizerDashboard';
import { ParticipantDashboard } from './components/dashboard/ParticipantDashboard';
import { ProfileCompletion } from './components/profile/ProfileCompletion';
import { EventForm } from './components/events/EventForm';
import { EventLandingPage } from './components/events/EventLandingPage';
import { UserRole } from './types';
import api from './lib/api';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route 
              path="/complete-profile" 
              element={
                <ProtectedRoute>
                  <ProfileCompletion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireEmailVerification>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/create" 
              element={
                <ProtectedRoute requireEmailVerification>
                  <EventForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:eventId/edit" 
              element={
                <ProtectedRoute requireEmailVerification>
                  <EventEditWrapper />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:eventId" 
              element={<EventLandingPage />} 
            />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Home() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Thittam1Hub</h1>
        <p className="text-gray-600 mb-8">Event Management Platform</p>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="bg-white text-indigo-600 px-6 py-2 rounded-md border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  // Check if organizer needs to complete profile (Requirements 2.4, 2.5)
  if (user?.role === UserRole.ORGANIZER && !user?.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (user?.role === UserRole.ORGANIZER) {
    return <OrganizerDashboard />;
  } else if (user?.role === UserRole.PARTICIPANT) {
    return <ParticipantDashboard />;
  }

  // For other roles, show a generic dashboard or redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.name}</p>
        <p className="text-sm text-gray-500 mt-2">Role: {user?.role}</p>
        <div className="mt-4">
          <Link
            to="/complete-profile"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventEditWrapper() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data.event;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/dashboard" replace />;
  }

  return <EventForm event={event} isEditing={true} />;
}

export default App;
