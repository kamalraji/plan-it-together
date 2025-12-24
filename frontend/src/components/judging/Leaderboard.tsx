import React, { useState, useEffect } from 'react';
import { Leaderboard as LeaderboardType } from '../../types';
import api from '../../lib/api';

interface LeaderboardProps {
  eventId: string;
  isOrganizer?: boolean;
  showControls?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  eventId, 
  isOrganizer = false, 
  showControls = false 
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time updates
    const interval = setInterval(fetchLeaderboard, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/events/${eventId}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setLeaderboard(null);
      } else {
        setError(error.response?.data?.error?.message || 'Failed to load leaderboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLeaderboardVisibility = async () => {
    if (!leaderboard) return;

    setUpdating(true);
    try {
      const response = await api.put(`/events/${eventId}/leaderboard/visibility`, {
        enabled: !leaderboard.enabled
      });
      
      setLeaderboard(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to update leaderboard visibility');
    } finally {
      setUpdating(false);
    }
  };

  const refreshLeaderboard = async () => {
    setUpdating(true);
    try {
      const response = await api.post(`/events/${eventId}/leaderboard/refresh`);
      setLeaderboard(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to refresh leaderboard');
    } finally {
      setUpdating(false);
    }
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading && !leaderboard) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No Scores Yet</h3>
          <p>The leaderboard will appear once judges start scoring submissions.</p>
          {showControls && isOrganizer && (
            <button
              onClick={refreshLeaderboard}
              disabled={updating}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Refreshing...' : 'Refresh Leaderboard'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // If leaderboard is disabled and user is not organizer, don't show it
  if (!leaderboard.enabled && !isOrganizer) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium mb-2">Leaderboard Hidden</h3>
          <p>The leaderboard is currently hidden by the organizers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {new Date(leaderboard.lastUpdated).toLocaleString()}
            </p>
          </div>
          
          {showControls && isOrganizer && (
            <div className="flex space-x-2">
              <button
                onClick={refreshLeaderboard}
                disabled={updating}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {updating ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={toggleLeaderboardVisibility}
                disabled={updating}
                className={`px-3 py-1 text-sm rounded-md disabled:opacity-50 ${
                  leaderboard.enabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {leaderboard.enabled ? 'Hide' : 'Show'} Public
              </button>
            </div>
          )}
        </div>

        {!leaderboard.enabled && isOrganizer && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Leaderboard is currently hidden from public view
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Entries */}
      <div className="divide-y divide-gray-200">
        {leaderboard.entries.map((entry) => (
          <div
            key={entry.id}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
              entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankDisplay(entry.rank)}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entry.teamName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Submission ID: {entry.submissionId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(entry.percentage)}`}>
                  {entry.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {entry.totalScore.toFixed(1)} / {entry.maxPossibleScore.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    entry.percentage >= 90 ? 'bg-green-500' :
                    entry.percentage >= 80 ? 'bg-blue-500' :
                    entry.percentage >= 70 ? 'bg-yellow-500' :
                    entry.percentage >= 60 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Total Submissions: {leaderboard.entries.length}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>90%+</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>80-89%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>70-79%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>60-69%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>&lt;60%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;