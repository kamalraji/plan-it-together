import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ParticipantDashboard } from '../ParticipantDashboard';

// Mock the API
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { registrations: [], certificates: [] } }),
  },
}));

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test Participant',
      email: 'participant@test.com',
      role: 'PARTICIPANT',
      emailVerified: true,
    },
    logout: jest.fn(),
  }),
}));

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
    jest.clearAllMocks();
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