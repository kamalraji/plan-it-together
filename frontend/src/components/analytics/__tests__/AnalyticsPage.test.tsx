import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsPage } from '../AnalyticsPage';
import { UserRole } from '../../../types';

// Mock the auth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.ORGANIZER,
      status: 'ACTIVE',
      emailVerified: true,
    },
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      eventId: 'test-event',
      eventName: 'Test Event',
      generatedAt: new Date().toISOString(),
      registrationOverTime: [],
      sessionCheckInRates: [],
      scoreDistributions: [],
      judgeParticipation: [],
      summary: {
        totalRegistrations: 100,
        confirmedRegistrations: 90,
        totalAttendance: 80,
        overallCheckInRate: 88.9,
        averageScore: 85.5,
        totalSubmissions: 50,
        totalJudges: 5,
      },
    }),
  })
) as jest.Mock;

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders analytics dashboard', async () => {
    render(<AnalyticsPage scope="event" eventId="test-event" />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive insights and performance metrics')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AnalyticsPage scope="global" />);
    
    // Should show loading indicators
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays tabs for different analytics views', async () => {
    render(<AnalyticsPage scope="event" eventId="test-event" />);
    
    // Wait for data to load and check for tabs
    await screen.findByText('Dashboard');
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Real-time')).toBeInTheDocument();
  });

  it('shows export button for organizers', async () => {
    render(<AnalyticsPage scope="event" eventId="test-event" />);
    
    // Wait for component to load
    await screen.findByText('Dashboard');
    
    // Should show export button for organizers
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});