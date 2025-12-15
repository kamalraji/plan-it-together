import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QRCodeDisplay } from '../QRCodeDisplay';
import { Registration, RegistrationStatus } from '../../../types';

import { vi } from 'vitest';

// Mock the API
vi.mock('../../../lib/api');

const mockRegistration: Registration = {
  id: 'reg-1',
  eventId: 'event-1',
  userId: 'user-1',
  status: RegistrationStatus.CONFIRMED,
  formResponses: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  qrCode: 'abc123def456',
  registeredAt: '2024-01-01T00:00:00Z',
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
      {component}
    </QueryClientProvider>
  );
};

describe('QRCodeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders QR code display component', () => {
    renderWithProviders(
      <QRCodeDisplay 
        registration={mockRegistration} 
        eventName="Test Event" 
      />
    );

    // Component should render without errors (loading state)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles different registration statuses', () => {
    const waitlistedRegistration = {
      ...mockRegistration,
      status: RegistrationStatus.WAITLISTED,
    };

    renderWithProviders(
      <QRCodeDisplay 
        registration={waitlistedRegistration} 
        eventName="Test Event" 
      />
    );

    // Component should render without errors for different statuses
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders with pending status', () => {
    const pendingRegistration = {
      ...mockRegistration,
      status: RegistrationStatus.PENDING,
    };

    renderWithProviders(
      <QRCodeDisplay 
        registration={pendingRegistration} 
        eventName="Test Event" 
      />
    );

    // Component should render without errors for pending status
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});