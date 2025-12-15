import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { EventLandingPage } from '../EventLandingPage';
import { EventMode } from '../../../types';
import { AuthProvider } from '../../../hooks/useAuth';

// Mock the API
vi.mock('../../../lib/api');

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

const mockEvent = {
  id: '1',
  name: 'Test Event',
  description: 'This is a test event description',
  mode: EventMode.OFFLINE,
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T18:00:00Z',
  organizerId: 'user1',
  branding: {
    logoUrl: 'http://example.com/logo.png',
    primaryColor: '#4F46E5'
  },
  venue: {
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345'
  },
  status: 'PUBLISHED' as const,
  landingPageUrl: 'http://example.com/event/1',
  timeline: [
    {
      id: '1',
      title: 'Opening Session',
      description: 'Welcome and introduction',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      type: 'session' as const,
      speaker: 'John Doe',
      location: 'Main Hall'
    }
  ],
  prizes: [
    {
      id: '1',
      title: 'First Place',
      description: 'Winner prize',
      value: '$1000',
      position: 1,
      category: 'Overall'
    }
  ],
  sponsors: [
    {
      id: '1',
      name: 'Test Sponsor',
      logoUrl: 'http://example.com/sponsor.png',
      website: 'http://sponsor.com',
      tier: 'gold' as const,
      description: 'Gold sponsor'
    }
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock successful query
  queryClient.setQueryData(['event', '1'], mockEvent);

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EventLandingPage', () => {
  it('renders event landing page with event details', () => {
    render(<EventLandingPage eventId="1" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('This is a test event description')).toBeInTheDocument();
    expect(screen.getByText('Sign Up to Register')).toBeInTheDocument();
  });

  it('displays event venue information for offline events', () => {
    render(<EventLandingPage eventId="1" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Test Venue, Test City')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
  });

  it('shows timeline information', () => {
    render(<EventLandingPage eventId="1" />, { wrapper: createWrapper() });
    
    // Click on schedule tab
    const scheduleTab = screen.getByText('Schedule');
    scheduleTab.click();
    
    expect(screen.getByText('Opening Session')).toBeInTheDocument();
    expect(screen.getByText('Welcome and introduction')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays prizes information', () => {
    render(<EventLandingPage eventId="1" />, { wrapper: createWrapper() });
    
    // Click on prizes tab
    const prizesTab = screen.getByText('Prizes');
    prizesTab.click();
    
    expect(screen.getByText('First Place')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('Winner prize')).toBeInTheDocument();
  });

  it('shows sponsors information', () => {
    render(<EventLandingPage eventId="1" />, { wrapper: createWrapper() });
    
    // Click on sponsors tab
    const sponsorsTab = screen.getByText('Sponsors');
    sponsorsTab.click();
    
    expect(screen.getByText('Gold Sponsors')).toBeInTheDocument();
    expect(screen.getByText('Test Sponsor')).toBeInTheDocument();
  });
});