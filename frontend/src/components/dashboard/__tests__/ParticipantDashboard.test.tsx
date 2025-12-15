import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ParticipantDashboard } from '../ParticipantDashboard';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { registrations: [], certificates: [] } }),
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
        name: 'Test Participant',
        email: 'participant@test.com',
        role: 'PARTICIPANT',
        emailVerified: true,
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

describe('ParticipantDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders participant dashboard with header and navigation', () => {
    renderWithProviders(<ParticipantDashboard />);
    
    expect(screen.getByText('Participant Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test Participant')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows empty state when no events are registered', () => {
    renderWithProviders(<ParticipantDashboard />);
    
    expect(screen.getByText('No Events Registered')).toBeInTheDocument();
    expect(screen.getByText('You haven\'t registered for any events yet. Browse available events to get started.')).toBeInTheDocument();
  });

  it('shows browse events button in empty state', () => {
    renderWithProviders(<ParticipantDashboard />);
    
    expect(screen.getByText('Browse Events')).toBeInTheDocument();
  });

  it('shows event count in header', () => {
    renderWithProviders(<ParticipantDashboard />);
    
    expect(screen.getByText('0 events registered')).toBeInTheDocument();
  });
});