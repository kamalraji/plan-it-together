import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { EventForm } from '../EventForm';
import { EventMode } from '../../../types';

// Mock the API
vi.mock('../../../lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EventForm', () => {
  it('renders create event form', () => {
    render(<EventForm />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('HYBRID')).toBeInTheDocument();
  });

  it('renders edit event form when editing', () => {
    const mockEvent = {
      id: '1',
      name: 'Test Event',
      description: 'Test Description',
      mode: EventMode.OFFLINE,
      startDate: '2024-01-01T10:00:00Z',
      endDate: '2024-01-01T18:00:00Z',
      organizerId: 'user1',
      branding: {},
      status: 'DRAFT' as const,
      landingPageUrl: 'http://example.com/event/1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    render(<EventForm event={mockEvent} isEditing={true} />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('shows venue fields when offline mode is selected', () => {
    render(<EventForm />, { wrapper: createWrapper() });
    
    // OFFLINE mode should be selected by default
    expect(screen.getByText('Venue Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Venue Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
  });
});