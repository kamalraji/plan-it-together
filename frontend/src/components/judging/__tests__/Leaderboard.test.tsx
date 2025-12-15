import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Leaderboard from '../Leaderboard';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import api from '../../../lib/api';
const mockedApi = vi.mocked(api);

describe('Leaderboard', () => {
  const mockEventId = 'event-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<Leaderboard eventId={mockEventId} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty leaderboard message', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: true,
      entries: [],
      lastUpdated: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });

    render(<Leaderboard eventId={mockEventId} />);
    
    await waitFor(() => {
      expect(screen.getByText('No Scores Yet')).toBeInTheDocument();
      expect(screen.getByText('The leaderboard will appear once judges start scoring submissions.')).toBeInTheDocument();
    });
  });

  it('renders leaderboard with entries', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: true,
      entries: [
        {
          id: 'entry-1',
          submissionId: 'submission-1',
          teamName: 'Team Alpha',
          totalScore: 95.5,
          maxPossibleScore: 100,
          percentage: 95.5,
          rank: 1,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'entry-2',
          submissionId: 'submission-2',
          teamName: 'Team Beta',
          totalScore: 87.2,
          maxPossibleScore: 100,
          percentage: 87.2,
          rank: 2,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'entry-3',
          submissionId: 'submission-3',
          teamName: 'Team Gamma',
          totalScore: 78.9,
          maxPossibleScore: 100,
          percentage: 78.9,
          rank: 3,
          lastUpdated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });

    render(<Leaderboard eventId={mockEventId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
      
      // Check rank displays
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
      
      // Check scores
      expect(screen.getByText('95.5%')).toBeInTheDocument();
      expect(screen.getByText('87.2%')).toBeInTheDocument();
      expect(screen.getByText('78.9%')).toBeInTheDocument();
    });
  });

  it('hides leaderboard when disabled for non-organizers', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: false,
      entries: [
        {
          id: 'entry-1',
          submissionId: 'submission-1',
          teamName: 'Team Alpha',
          totalScore: 95.5,
          maxPossibleScore: 100,
          percentage: 95.5,
          rank: 1,
          lastUpdated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });

    render(<Leaderboard eventId={mockEventId} isOrganizer={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaderboard Hidden')).toBeInTheDocument();
      expect(screen.getByText('The leaderboard is currently hidden by the organizers.')).toBeInTheDocument();
      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
    });
  });

  it('shows organizer controls when isOrganizer is true', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: true,
      entries: [
        {
          id: 'entry-1',
          submissionId: 'submission-1',
          teamName: 'Team Alpha',
          totalScore: 95.5,
          maxPossibleScore: 100,
          percentage: 95.5,
          rank: 1,
          lastUpdated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });

    render(<Leaderboard eventId={mockEventId} isOrganizer={true} showControls={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText('Hide Public')).toBeInTheDocument();
    });
  });

  it('toggles leaderboard visibility', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: true,
      entries: [
        {
          id: 'entry-1',
          submissionId: 'submission-1',
          teamName: 'Team Alpha',
          totalScore: 95.5,
          maxPossibleScore: 100,
          percentage: 95.5,
          rank: 1,
          lastUpdated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    const mockUpdatedLeaderboard = {
      ...mockLeaderboard,
      enabled: false
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });
    mockedApi.put.mockResolvedValue({ data: mockUpdatedLeaderboard });

    render(<Leaderboard eventId={mockEventId} isOrganizer={true} showControls={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Hide Public')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hide Public'));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(`/events/${mockEventId}/leaderboard/visibility`, {
        enabled: false
      });
    });
  });

  it('refreshes leaderboard data', async () => {
    const mockLeaderboard = {
      eventId: mockEventId,
      enabled: true,
      entries: [
        {
          id: 'entry-1',
          submissionId: 'submission-1',
          teamName: 'Team Alpha',
          totalScore: 95.5,
          maxPossibleScore: 100,
          percentage: 95.5,
          rank: 1,
          lastUpdated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockLeaderboard });
    mockedApi.post.mockResolvedValue({ data: mockLeaderboard });

    render(<Leaderboard eventId={mockEventId} isOrganizer={true} showControls={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(`/events/${mockEventId}/leaderboard/refresh`);
    });
  });
});