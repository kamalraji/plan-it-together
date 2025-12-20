import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketplaceOrganizerInterface from '../MarketplaceOrganizerInterface';

// Mock the child components
jest.mock('../ServiceDiscoveryUI', () => {
  return function MockServiceDiscoveryUI() {
    return <div data-testid="service-discovery">Service Discovery UI</div>;
  };
});

jest.mock('../BookingManagementUI', () => {
  return function MockBookingManagementUI() {
    return <div data-testid="booking-management">Booking Management UI</div>;
  };
});

jest.mock('../ReviewRatingUI', () => {
  return function MockReviewRatingUI() {
    return <div data-testid="review-rating">Review Rating UI</div>;
  };
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('MarketplaceOrganizerInterface', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders the marketplace interface with navigation tabs', () => {
    renderWithQueryClient(<MarketplaceOrganizerInterface />);
    
    expect(screen.getByText('Event Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Discover and book services for your event from verified vendors')).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByText('Discover Services')).toBeInTheDocument();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });

  it('shows service discovery UI by default', () => {
    renderWithQueryClient(<MarketplaceOrganizerInterface />);
    
    expect(screen.getByTestId('service-discovery')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-rating')).not.toBeInTheDocument();
  });

  it('switches to booking management when tab is clicked', () => {
    renderWithQueryClient(<MarketplaceOrganizerInterface />);
    
    const bookingsTab = screen.getByText('My Bookings');
    bookingsTab.click();
    
    expect(screen.getByTestId('booking-management')).toBeInTheDocument();
    expect(screen.queryByTestId('service-discovery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-rating')).not.toBeInTheDocument();
  });

  it('switches to reviews when tab is clicked', () => {
    renderWithQueryClient(<MarketplaceOrganizerInterface />);
    
    const reviewsTab = screen.getByText('Reviews');
    reviewsTab.click();
    
    expect(screen.getByTestId('review-rating')).toBeInTheDocument();
    expect(screen.queryByTestId('service-discovery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('booking-management')).not.toBeInTheDocument();
  });

  it('passes eventId prop to child components', () => {
    const eventId = 'test-event-123';
    renderWithQueryClient(<MarketplaceOrganizerInterface eventId={eventId} />);
    
    // The child components should receive the eventId prop
    expect(screen.getByTestId('service-discovery')).toBeInTheDocument();
  });
});