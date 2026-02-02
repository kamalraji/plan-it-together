import React, { useState } from 'react';
import api from '../../lib/api';

interface WorkspaceTemplateRatingProps {
  templateId: string;
  workspaceId: string;
  onRatingSubmitted: () => void;
  onCancel: () => void;
}

interface RatingData {
  rating: number;
  feedback: string;
  completionRate: number;
  teamSatisfaction: number;
  eventSuccess: boolean;
  wouldRecommend: boolean;
}

export function WorkspaceTemplateRating({ 
  templateId, 
  workspaceId, 
  onRatingSubmitted, 
  onCancel 
}: WorkspaceTemplateRatingProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    rating: 0,
    feedback: '',
    completionRate: 0,
    teamSatisfaction: 0,
    eventSuccess: false,
    wouldRecommend: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingChange = (field: keyof RatingData, value: any) => {
    setRatingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStarClick = (field: 'rating' | 'teamSatisfaction', value: number) => {
    setRatingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ratingData.rating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/api/workspace-templates/${templateId}/rate`, {
        workspaceId,
        ...ratingData
      });
      onRatingSubmitted();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      setError(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (
    field: 'rating' | 'teamSatisfaction',
    currentValue: number,
    label: string
  ) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(field, star)}
              className={`h-8 w-8 ${
                star <= currentValue ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {currentValue > 0 ? `${currentValue}/5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rate Template Experience</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help others by sharing your experience with this workspace template
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Rating */}
          <div>
            {renderStars('rating', ratingData.rating, 'Overall Rating *')}
          </div>

          {/* Team Satisfaction */}
          <div>
            {renderStars('teamSatisfaction', ratingData.teamSatisfaction, 'Team Satisfaction')}
          </div>

          {/* Completion Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Completion Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={ratingData.completionRate}
              onChange={(e) => handleRatingChange('completionRate', parseInt(e.target.value) || 0)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 85"
            />
            <p className="text-xs text-gray-500 mt-1">
              What percentage of planned tasks were completed?
            </p>
          </div>

          {/* Event Success */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Outcome
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventSuccess"
                  checked={ratingData.eventSuccess === true}
                  onChange={() => handleRatingChange('eventSuccess', true)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Event was successful</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventSuccess"
                  checked={ratingData.eventSuccess === false}
                  onChange={() => handleRatingChange('eventSuccess', false)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Event had challenges</span>
              </label>
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center">
            <input
              id="wouldRecommend"
              type="checkbox"
              checked={ratingData.wouldRecommend}
              onChange={(e) => handleRatingChange('wouldRecommend', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="wouldRecommend" className="ml-2 block text-sm text-gray-900">
              I would recommend this template to others
            </label>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={ratingData.feedback}
              onChange={(e) => handleRatingChange('feedback', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Share what worked well, what could be improved, or any suggestions for future users..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || ratingData.rating === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}