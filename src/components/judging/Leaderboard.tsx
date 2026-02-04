import React, { useState, useEffect } from 'react';
import { Leaderboard as LeaderboardType } from '../../types';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardProps {
  eventId: string;
  isOrganizer?: boolean;
  showControls?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  eventId,
  isOrganizer = false,
  showControls = false,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('judging-leaderboard', {
        body: { eventId },
      });

      if (error) throw error;
      setLeaderboard(data.leaderboard as LeaderboardType);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
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
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6">
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
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No Scores Yet</h3>
          <p>The leaderboard will appear once judges start scoring submissions.</p>
        </div>
      </div>
    );
  }

  // If leaderboard is disabled and user is not organizer, don't show it
  if (!leaderboard.enabled && !isOrganizer) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium mb-2">Leaderboard Hidden</h3>
          <p>The leaderboard is currently hidden by the organizers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date(leaderboard.lastUpdated).toLocaleString()}
            </p>
          </div>

          {showControls && isOrganizer && (
            <div className="flex space-x-2">
              {/* Controls removed in Supabase version; auto-refresh keeps data fresh */}
            </div>
          )}
        </div>

        {!leaderboard.enabled && isOrganizer && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">⚠️ Leaderboard is currently hidden from public view</p>
          </div>
        )}
      </div>

      {/* Leaderboard Entries */}
      <div className="divide-y divide-border">
        {leaderboard.entries.map((entry) => (
          <div
            key={entry.id}
            className={`px-6 py-4 hover:bg-muted/50 transition-colors ${
              entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankDisplay(entry.rank)}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {entry.teamName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submission ID: {entry.submissionId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(entry.percentage)}`}>
                  {entry.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.totalScore.toFixed(1)} / {entry.maxPossibleScore.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-2">
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
      <div className="px-6 py-4 bg-muted/50 border-t border-border">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
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