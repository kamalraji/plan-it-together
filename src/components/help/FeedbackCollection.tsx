import React, { useState } from 'react';
import { 
  StarIcon as Star, 
  PaperAirplaneIcon as Send, 
  ChatBubbleBottomCenterTextIcon as MessageSquare, 
  LightBulbIcon as Lightbulb, 
  BugAntIcon as Bug, 
  HandThumbUpIcon as ThumbsUp, 
  HandThumbDownIcon as ThumbsDown, 
  CheckCircleIcon as CheckCircle 
} from '@heroicons/react/24/outline';

interface FeedbackCollectionProps {
  searchQuery?: string;
  currentContext?: string;
  user?: any;
}

interface FeedbackItem {
  id: string;
  type: 'rating' | 'suggestion' | 'bug' | 'general';
  title: string;
  description: string;
  rating?: number;
  category: string;
  status: 'submitted' | 'under_review' | 'planned' | 'implemented' | 'declined';
  submittedAt: string;
  votes: number;
  userVoted?: boolean;
}

interface FeedbackForm {
  type: 'rating' | 'suggestion' | 'bug' | 'general';
  title: string;
  description: string;
  rating: number;
  category: string;
  email: string;
  allowContact: boolean;
}

export const FeedbackCollection: React.FC<FeedbackCollectionProps> = ({
  searchQuery = '',
  currentContext: _currentContext,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'browse'>('submit');
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    type: 'general',
    title: '',
    description: '',
    rating: 5,
    category: 'general',
    email: user?.email || '',
    allowContact: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackItem[]>([]);

  // Mock existing feedback data
  const mockFeedback: FeedbackItem[] = [
    {
      id: '1',
      type: 'suggestion',
      title: 'Add bulk actions for event management',
      description: 'It would be great to have bulk actions like bulk delete, bulk edit for managing multiple events at once.',
      category: 'events',
      status: 'planned',
      submittedAt: '2024-01-10T10:00:00Z',
      votes: 23,
      userVoted: false
    },
    {
      id: '2',
      type: 'bug',
      title: 'Mobile navigation menu not working properly',
      description: 'On mobile devices, the navigation menu sometimes doesn\'t close when clicking outside.',
      category: 'ui',
      status: 'under_review',
      submittedAt: '2024-01-08T14:30:00Z',
      votes: 15,
      userVoted: true
    },
    {
      id: '3',
      type: 'rating',
      title: 'Overall platform experience',
      description: 'Love the new workspace features! Makes team collaboration much easier.',
      rating: 5,
      category: 'general',
      status: 'submitted',
      submittedAt: '2024-01-05T09:15:00Z',
      votes: 8,
      userVoted: false
    }
  ];

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts about the platform' },
    { value: 'suggestion', label: 'Feature Request', icon: Lightbulb, description: 'Suggest new features or improvements' },
    { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Report issues or problems you\'ve encountered' },
    { value: 'rating', label: 'Rate Experience', icon: Star, description: 'Rate your overall experience' }
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'events', label: 'Event Management' },
    { value: 'workspaces', label: 'Workspaces' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'ui', label: 'User Interface' },
    { value: 'performance', label: 'Performance' },
    { value: 'mobile', label: 'Mobile Experience' }
  ];

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    planned: 'bg-purple-100 text-purple-800',
    implemented: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800'
  };

  React.useEffect(() => {
    setExistingFeedback(mockFeedback);
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to feedback list
      const newFeedback: FeedbackItem = {
        id: String(Math.random()).slice(2, 8),
        ...feedbackForm,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        votes: 0,
        userVoted: false
      };
      
      setExistingFeedback(prev => [newFeedback, ...prev]);
      setSubmitted(true);
      
      // Reset form
      setFeedbackForm({
        type: 'general',
        title: '',
        description: '',
        rating: 5,
        category: 'general',
        email: user?.email || '',
        allowContact: true
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = (feedbackId: string, isUpvote: boolean) => {
    setExistingFeedback(prev => prev.map(item => {
      if (item.id === feedbackId) {
        const newVotes = item.userVoted 
          ? item.votes - 1 
          : item.votes + (isUpvote ? 1 : -1);
        return {
          ...item,
          votes: Math.max(0, newVotes),
          userVoted: !item.userVoted
        };
      }
      return item;
    }));
  };

  const renderStarRating = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`w-6 h-6 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${onChange ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  const filteredFeedback = searchQuery
    ? existingFeedback.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : existingFeedback;

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank You for Your Feedback!</h2>
        <p className="text-gray-600 mb-6">
          We appreciate you taking the time to share your thoughts. 
          Your feedback helps us improve the platform for everyone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit More Feedback
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Browse Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('submit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Feedback ({existingFeedback.length})
            </button>
          </nav>
        </div>

        {/* Submit Feedback Tab */}
        {activeTab === 'submit' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Your Feedback</h2>
            
            {/* Feedback Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of feedback would you like to share?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackForm(prev => ({ ...prev, type: type.value as any }))}
                      className={`p-4 text-left border rounded-lg transition-colors ${
                        feedbackForm.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Icon className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief summary of your feedback"
                />
              </div>

              {/* Rating (only for rating type) */}
              {feedbackForm.type === 'rating' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex items-center space-x-4">
                    {renderStarRating(feedbackForm.rating, (rating) => 
                      setFeedbackForm(prev => ({ ...prev, rating }))
                    )}
                    <span className="text-sm text-gray-600">
                      {feedbackForm.rating} out of 5 stars
                    </span>
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={feedbackForm.category}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={5}
                  value={feedbackForm.description}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide detailed feedback..."
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowContact"
                    checked={feedbackForm.allowContact}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, allowContact: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowContact" className="ml-2 text-sm text-gray-700">
                    Allow us to contact you about this feedback
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Browse Feedback Tab */}
        {activeTab === 'browse' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Feedback</h2>
            
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        {item.type === 'rating' && item.rating && (
                          <div className="flex items-center">
                            {renderStarRating(item.rating)}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                        <span>
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Voting */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleVote(item.id, true)}
                        className={`p-1 rounded ${
                          item.userVoted ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-700">{item.votes}</span>
                      <button
                        onClick={() => handleVote(item.id, false)}
                        className="p-1 rounded text-gray-400 hover:text-red-600"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredFeedback.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No feedback found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};