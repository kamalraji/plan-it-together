import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  InboxIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from './PageHeader';
import { CommunicationHistory } from '../communication/CommunicationHistory';
import { EmailComposer } from '../communication/EmailComposer';
import { EmptyInbox } from '@/components/illustrations';

interface CommunicationMessage {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  category: 'workspace' | 'event' | 'marketplace' | 'organization' | 'system';
  type: 'email' | 'notification' | 'announcement' | 'reminder';
  timestamp: Date;
  read: boolean;
  archived: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  metadata?: Record<string, any>;
}

interface CommunicationPreferences {
  emailNotifications: {
    taskAssignments: boolean;
    eventUpdates: boolean;
    marketplaceActivity: boolean;
    organizationNews: boolean;
    systemAlerts: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    workspace: boolean;
    event: boolean;
    marketplace: boolean;
    organization: boolean;
    system: boolean;
  };
}

// Mock data
const mockMessages: CommunicationMessage[] = [
  {
    id: '1',
    subject: 'Task Assignment: Design Event Brochure',
    content: 'Hi! I\'ve assigned you to work on the event brochure design. The deadline is March 20th. Please let me know if you have any questions.',
    sender: {
      id: 'sarah-123',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
    },
    recipients: [
      { id: 'user-456', name: 'You', email: 'you@example.com', type: 'to' }
    ],
    category: 'workspace',
    type: 'notification',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    archived: false,
    metadata: { workspaceId: 'marketing', taskId: '123' }
  },
  {
    id: '2',
    subject: 'Event Update: Annual Conference 2024',
    content: 'Great news! We\'ve reached 500 registrations for the Annual Conference. The venue has been confirmed and we\'re on track for a successful event.',
    sender: {
      id: 'system',
      name: 'Thittam1Hub System',
      email: 'noreply@thittam1hub.com',
    },
    recipients: [
      { id: 'user-456', name: 'You', email: 'you@example.com', type: 'to' }
    ],
    category: 'event',
    type: 'announcement',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    archived: false,
    metadata: { eventId: 'annual-conference-2024' }
  },
  {
    id: '3',
    subject: 'Service Booking Confirmation',
    content: 'Your photography service booking has been confirmed for March 15, 2024. The photographer will contact you 24 hours before the event.',
    sender: {
      id: 'vendor-789',
      name: 'PhotoPro Services',
      email: 'bookings@photopro.com',
    },
    recipients: [
      { id: 'user-456', name: 'You', email: 'you@example.com', type: 'to' }
    ],
    category: 'marketplace',
    type: 'email',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    archived: false,
    metadata: { serviceId: 'photo-service-123', bookingId: 'booking-456' }
  },
];

const defaultPreferences: CommunicationPreferences = {
  emailNotifications: {
    taskAssignments: true,
    eventUpdates: true,
    marketplaceActivity: true,
    organizationNews: false,
    systemAlerts: true,
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  categories: {
    workspace: true,
    event: true,
    marketplace: true,
    organization: true,
    system: true,
  },
};

export const CommunicationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'history' | 'preferences'>('inbox');
  const [messages] = useState<CommunicationMessage[]>(mockMessages);
  const [preferences, setPreferences] = useState<CommunicationPreferences>(defaultPreferences);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter messages
  const filteredMessages = React.useMemo(() => {
    let filtered = messages;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(m => !m.read);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.sender.name.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [messages, selectedCategory, showUnreadOnly, searchQuery]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => !m.read).length;
    const archived = messages.filter(m => m.archived).length;
    const categories = messages.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, archived, categories };
  }, [messages]);

  const categories = [
    { id: 'all', label: 'All', count: stats.total, icon: InboxIcon },
    { id: 'workspace', label: 'Workspace', count: stats.categories.workspace || 0, icon: UserGroupIcon },
    { id: 'event', label: 'Events', count: stats.categories.event || 0, icon: CalendarIcon },
    { id: 'marketplace', label: 'Marketplace', count: stats.categories.marketplace || 0, icon: ShoppingBagIcon },
    { id: 'organization', label: 'Organization', count: stats.categories.organization || 0, icon: BuildingOfficeIcon },
    { id: 'system', label: 'System', count: stats.categories.system || 0, icon: Cog6ToothIcon },
  ].filter(category => category.count > 0);

  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: stats.unread },
    { id: 'compose', label: 'Compose', icon: PaperAirplaneIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
  ];

  const pageActions = [
    {
      label: 'Compose Message',
      action: () => setActiveTab('compose'),
      variant: 'primary' as const,
    },
    {
      label: 'Mark All Read',
      action: () => {/* Mark all as read */},
      variant: 'secondary' as const,
      disabled: stats.unread === 0,
    },
  ];

  const handlePreferenceChange = (section: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CommunicationPreferences] as any),
        [key]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Communications"
        subtitle={`${stats.total} messages, ${stats.unread} unread`}
        actions={pageActions}
        breadcrumbs={[
          { label: 'Console', href: '/console' },
          { label: 'Communications', href: '/console/communications' },
        ]}
        tabs={tabs.map(tab => ({
          id: tab.id,
          label: tab.count ? `${tab.label} (${tab.count})` : tab.label,
          current: activeTab === tab.id,
          onClick: () => setActiveTab(tab.id as any),
        }))}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Messages
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Unread Filter */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showUnreadOnly}
                      onChange={(e) => setShowUnreadOnly(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show unread only</span>
                  </label>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{category.label}</span>
                          </div>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Messages List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow">
                {/* Results Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FunnelIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {filteredMessages.length} of {stats.total} messages
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {stats.unread} unread
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="divide-y divide-gray-200">
                  {filteredMessages.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <EmptyInbox size="sm" showBackground={false} />
                      <h3 className="text-lg font-medium text-foreground mb-2 mt-4">No messages found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || selectedCategory !== 'all' || showUnreadOnly
                          ? 'Try adjusting your filters or search terms.'
                          : 'Your inbox is empty. New messages will appear here.'}
                      </p>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <MessageListItem key={message.id} message={message} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Compose Message</h2>
              <EmailComposer eventId="default" />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Communication History</h2>
              <CommunicationHistory eventId="default" />
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Communication Preferences</h2>
              
              <div className="space-y-8">
                {/* Email Notifications */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.emailNotifications).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <p className="text-xs text-gray-500">
                            Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePreferenceChange('emailNotifications', key, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Notification Frequency</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'immediate', label: 'Immediate', description: 'Receive notifications as they happen' },
                      { value: 'daily', label: 'Daily Digest', description: 'Receive a daily summary of notifications' },
                      { value: 'weekly', label: 'Weekly Digest', description: 'Receive a weekly summary of notifications' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-start">
                        <input
                          type="radio"
                          name="frequency"
                          value={option.value}
                          checked={preferences.frequency === option.value}
                          onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value as any }))}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-700">{option.label}</span>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Quiet Hours</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.quietHours.enabled}
                        onChange={(e) => handlePreferenceChange('quietHours', 'enabled', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable quiet hours</span>
                    </label>
                    
                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) => handlePreferenceChange('quietHours', 'start', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) => handlePreferenceChange('quietHours', 'end', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MessageListItemProps {
  message: CommunicationMessage;
}

const MessageListItem: React.FC<MessageListItemProps> = ({ message }) => {
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'notification': return 'bg-yellow-100 text-yellow-800';
      case 'announcement': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${!message.read ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {message.sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-sm font-medium ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                  {message.sender.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                  {message.type}
                </span>
              </div>
              
              <h4 className={`text-base font-medium mb-2 ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {message.subject}
              </h4>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {message.content}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center space-x-4 mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {message.category}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.attachments && message.attachments.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Attachments: {message.attachments.length} file{message.attachments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Unread Indicator */}
            {!message.read && (
              <div className="flex-shrink-0 ml-4">
                <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPage;