import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CommunicationInterface } from '../CommunicationInterface';

import { vi } from 'vitest';

// Mock the child components
vi.mock('../EmailComposer', () => ({
  EmailComposer: ({ eventId }: { eventId: string }) => (
    <div data-testid="email-composer">Email Composer for event {eventId}</div>
  ),
}));

vi.mock('../CommunicationHistory', () => ({
  CommunicationHistory: ({ eventId }: { eventId: string }) => (
    <div data-testid="communication-history">Communication History for event {eventId}</div>
  ),
}));

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

describe('CommunicationInterface', () => {
  it('renders with event ID prop', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CommunicationInterface eventId="test-event-123" />
      </Wrapper>
    );

    expect(screen.getByText('Event Communication')).toBeInTheDocument();
    expect(screen.getByText('Send targeted communications to event participants and manage your communication history.')).toBeInTheDocument();
  });

  it('shows error message when no event ID is provided', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CommunicationInterface />
      </Wrapper>
    );

    expect(screen.getByText('Event ID Required')).toBeInTheDocument();
    expect(screen.getByText('Please select an event to access communication features.')).toBeInTheDocument();
  });

  it('renders tab navigation correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CommunicationInterface eventId="test-event-123" />
      </Wrapper>
    );

    expect(screen.getByText('Compose Email')).toBeInTheDocument();
    expect(screen.getByText('Communication History')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CommunicationInterface eventId="test-event-123" />
      </Wrapper>
    );

    // Initially shows compose tab
    expect(screen.getByTestId('email-composer')).toBeInTheDocument();
    expect(screen.queryByTestId('communication-history')).not.toBeInTheDocument();

    // Click on history tab
    fireEvent.click(screen.getByText('Communication History'));

    // Now shows history tab
    expect(screen.queryByTestId('email-composer')).not.toBeInTheDocument();
    expect(screen.getByTestId('communication-history')).toBeInTheDocument();

    // Click back to compose tab
    fireEvent.click(screen.getByText('Compose Email'));

    // Shows compose tab again
    expect(screen.getByTestId('email-composer')).toBeInTheDocument();
    expect(screen.queryByTestId('communication-history')).not.toBeInTheDocument();
  });

  it('passes event ID to child components', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CommunicationInterface eventId="test-event-456" />
      </Wrapper>
    );

    expect(screen.getByText('Email Composer for event test-event-456')).toBeInTheDocument();

    // Switch to history tab
    fireEvent.click(screen.getByText('Communication History'));
    expect(screen.getByText('Communication History for event test-event-456')).toBeInTheDocument();
  });
});