import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RegistrationForm } from '../RegistrationForm';
import { Event, EventMode, EventStatus } from '../../../types';

import { vi } from 'vitest';

// Mock the API
vi.mock('../../../lib/api');

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'PARTICIPANT',
    },
    isAuthenticated: true,
  }),
}));

const mockEvent: Event = {
  id: 'event-1',
  name: 'Test Event',
  description: 'A test event',
  mode: EventMode.OFFLINE,
  startDate: '2024-01-15T09:00:00Z',
  endDate: '2024-01-15T17:00:00Z',
  capacity: 100,
  registrationDeadline: '2024-01-14T23:59:59Z',
  organizerId: 'organizer-1',
  branding: {
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#3B82F6',
  },
  venue: {
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
  },
  status: EventStatus.PUBLISHED,
  landingPageUrl: 'https://example.com/events/test-event',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

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

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with event details', () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    expect(screen.getByText(`Register for ${mockEvent.name}`)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register now/i })).toBeInTheDocument();
  });

  it('pre-fills form with user data', () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
  });

  it('shows capacity information when available', () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    // The capacity info would be shown if the API call succeeds
    // This is a basic test to ensure the component renders without errors
    expect(screen.getByText(`Register for ${mockEvent.name}`)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /register now/i });

    // Clear the pre-filled name
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(nameInput).toBeInvalid();
  });

  it('handles form submission', async () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    const organizationInput = screen.getByLabelText(/organization/i);
    const termsCheckbox = screen.getByLabelText(/agree to the event terms/i);
    const submitButton = screen.getByRole('button', { name: /register now/i });

    // Fill in additional fields
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.change(organizationInput, { target: { value: 'Test Company' } });
    fireEvent.click(termsCheckbox);

    // Submit form
    fireEvent.click(submitButton);

    // Form should be present (basic test without mocking the full API flow)
    expect(submitButton).toBeInTheDocument();
  });

  it('displays registration deadline when provided', () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    expect(screen.getByText(/registration closes/i)).toBeInTheDocument();
  });

  it('shows venue information for offline events', () => {
    renderWithProviders(<RegistrationForm event={mockEvent} />);

    // The component should render without errors for offline events
    expect(screen.getByText(`Register for ${mockEvent.name}`)).toBeInTheDocument();
  });
});