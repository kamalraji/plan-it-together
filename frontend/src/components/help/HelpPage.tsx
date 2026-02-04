import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon as Search, 
  BookOpenIcon as Book, 
  ChatBubbleLeftRightIcon as MessageCircle, 
  PlayIcon as Video, 
  DocumentTextIcon as FileText, 
  ArrowTopRightOnSquareIcon as ExternalLink, 
  StarIcon as Star, 
  HandThumbUpIcon as ThumbsUp, 
  HandThumbDownIcon as ThumbsDown 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { KnowledgeBase } from './KnowledgeBase';
import { InteractiveTutorials } from './InteractiveTutorials';
import { SupportContact } from './SupportContact';
import { FeedbackCollection } from './FeedbackCollection';

interface HelpPageProps {
  currentContext?: string; // Current page/feature context for contextual help
}

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  roles?: string[];
}

interface ContextualHelpItem {
  id: string;
  title: string;
  content: string;
  context: string;
  type: 'tip' | 'guide' | 'warning' | 'info';
  roles?: string[];
}

export const HelpPage: React.FC<HelpPageProps> = ({ currentContext }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('knowledge-base');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextualHelp, setContextualHelp] = useState<ContextualHelpItem[]>([]);
  const [, setLoading] = useState(false);

  const helpSections: HelpSection[] = [
    {
      id: 'knowledge-base',
      title: 'Knowledge Base',
      description: 'Browse articles, guides, and documentation',
      icon: Book,
      component: KnowledgeBase,
    },
    {
      id: 'tutorials',
      title: 'Interactive Tutorials',
      description: 'Step-by-step guided walkthroughs',
      icon: Video,
      component: InteractiveTutorials,
    },
    {
      id: 'support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: MessageCircle,
      component: SupportContact,
    },
    {
      id: 'feedback',
      title: 'Feedback',
      description: 'Share your thoughts and suggestions',
      icon: Star,
      component: FeedbackCollection,
    },
  ];

  // Load contextual help based on current page/feature
  useEffect(() => {
    if (currentContext) {
      loadContextualHelp(currentContext);
    }
  }, [currentContext]);

  const loadContextualHelp = async (context: string) => {
    setLoading(true);
    try {
      // Mock contextual help data - in real implementation, this would come from API
      const mockContextualHelp: ContextualHelpItem[] = [
        {
          id: '1',
          title: 'Getting Started with Events',
          content: 'Learn how to create your first event and configure basic settings.',
          context: 'events',
          type: 'guide',
          roles: ['ORGANIZER'],
        },
        {
          id: '2',
          title: 'Managing Team Members',
          content: 'Add team members to your workspace and assign roles effectively.',
          context: 'workspace',
          type: 'tip',
          roles: ['ORGANIZER', 'TEAM_LEAD'],
        },
        {
          id: '3',
          title: 'Marketplace Best Practices',
          content: 'Tips for finding and booking the best services for your event.',
          context: 'marketplace',
          type: 'info',
          roles: ['ORGANIZER'],
        },
      ];

      const filteredHelp = mockContextualHelp.filter(
        item => item.context === context && 
        (!item.roles || item.roles.includes(user?.role || ''))
      );

      setContextualHelp(filteredHelp);
    } catch (error) {
      console.error('Failed to load contextual help:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Search functionality will be handled by individual components
  };

  const renderContextualHelp = () => {
    if (!currentContext || contextualHelp.length === 0) return null;

    return (
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Help for Current Page
        </h3>
        <div className="space-y-4">
          {contextualHelp.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-l-4 ${
                item.type === 'tip' ? 'bg-green-50 border-green-400' :
                item.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                item.type === 'guide' ? 'bg-blue-50 border-blue-400' :
                'bg-gray-50 border-gray-400'
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
              <p className="text-gray-700 text-sm">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ActiveComponent = helpSections.find(section => section.id === activeSection)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-gray-600 mt-1">
                Find answers, learn new features, and get support
              </p>
            </div>
            
            {/* Global Search */}
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {helpSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-gray-500">{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Quick Links */}
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <a
                  href="/console/events/create"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Create New Event
                </a>
                <a
                  href="/console/workspaces"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Workspaces
                </a>
                <a
                  href="/console/marketplace"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContextualHelp()}
            
            {ActiveComponent && (
              <ActiveComponent 
                searchQuery={searchQuery}
                currentContext={currentContext}
                user={user}
              />
            )}
            
            {/* Quick Feedback Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Was this helpful?</p>
              <div className="flex space-x-2">
                <button className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Yes
                </button>
                <button className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};