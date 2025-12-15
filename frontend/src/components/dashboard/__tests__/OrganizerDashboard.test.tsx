import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { OrganizerDashboard } from '../OrganizerDashboard';
import { AuthProvider } from '../../../hooks/useAuth';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ 
      data: { 
        events: [], 
        totalEvents: 0, 
        totalRegistrations: 0, 
        activeEvents: 0, 
        certificatesIssued: 0 
      } 
    }),
  },
}));

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '1',
        name: 'Test Organizer',
        email: 'organizer@test.com',
        role: 'ORGANIZER',
        emailVerified: true,
        profileCompleted: false,
        bio: null,
        organization: null,
      },
      logout: vi.fn(),
    }),
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('OrganizerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders organizer dashboard with header and navigation', () => {
    renderWithProviders(<OrganizerDashboard />);
    
    expect(screen.getByText('Organizer Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test Organizer')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows profile completion prompt when profile is incomplete', () => {
    renderWithProviders(<OrganizerDashboard />);
    
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Complete your organizer profile to unlock all dashboard features and improve your event management experience.')).toBeInTheDocument();
  });

  it('shows create event button', () => {
    renderWithProviders(<OrganizerDashboard />);
    
    const createEventButtons = screen.getAllByText('Create Event');
    expect(createEventButtons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no events exist', () => {
    renderWithProviders(<OrganizerDashboard />);
    
    expect(screen.getByText('No events yet')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first event.')).toBeInTheDocument();
  });
});