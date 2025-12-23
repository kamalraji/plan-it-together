import React, { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon as MessageCircle, 
  EnvelopeIcon as Mail, 
  PhoneIcon as Phone, 
  ClockIcon as Clock, 
  PaperAirplaneIcon as Send, 
  PaperClipIcon as Paperclip, 
  ExclamationTriangleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle 
} from '@heroicons/react/24/outline';

interface SupportContactProps {
  searchQuery?: string;
  currentContext?: string;
  user?: any;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: File[];
}

interface ContactMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  availability: string;
  responseTime: string;
  action: () => void;
}

export const SupportContact: React.FC<SupportContactProps> = ({
  searchQuery = '',
  currentContext,
  user
}) => {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: searchQuery ? `Issue with: ${searchQuery}` : '',
    description: currentContext ? `Issue occurred in: ${currentContext}\n\n` : '',
    priority: 'medium' as const,
    category: 'general',
    attachments: [] as File[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  // Mock existing tickets
  const mockTickets: SupportTicket[] = [
    {
      id: 'TICK-001',
      subject: 'Unable to create event',
      description: 'Getting an error when trying to create a new event...',
      priority: 'high',
      category: 'technical',
      status: 'in_progress',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 'TICK-002',
      subject: 'Question about workspace permissions',
      description: 'How do I change team member roles in workspace?',
      priority: 'medium',
      category: 'general',
      status: 'resolved',
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-11T16:45:00Z'
    }
  ];

  const contactMethods: ContactMethod[] = [
    {
      id: 'live-chat',
      name: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      availability: 'Mon-Fri, 9 AM - 6 PM EST',
      responseTime: 'Usually within 2 minutes',
      action: () => {
        // In real implementation, this would open a chat widget
        alert('Live chat would open here');
      }
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      availability: '24/7',
      responseTime: 'Usually within 4 hours',
      action: () => setShowTicketForm(true)
    },
    {
      id: 'phone',
      name: 'Phone Support',
      description: 'Speak directly with our team',
      icon: Phone,
      availability: 'Mon-Fri, 9 AM - 6 PM EST',
      responseTime: 'Immediate',
      action: () => {
        window.open('tel:+1-555-SUPPORT');
      }
    }
  ];

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Account' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setTicketForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setTicketForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to tickets list
      const newTicket: SupportTicket = {
        id: `TICK-${String(Math.random()).slice(2, 8)}`,
        ...ticketForm,
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'unknown@example.com',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMyTickets(prev => [newTicket, ...prev]);
      setSubmitted(true);
      setShowTicketForm(false);
      
      // Reset form
      setTicketForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
        attachments: []
      });
    } catch (error) {
      console.error('Failed to submit ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'text-gray-600';
  };

  React.useEffect(() => {
    setMyTickets(mockTickets);
  }, []);

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">
          We've received your support request and will get back to you soon. 
          You can track the progress of your ticket below.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View My Tickets
        </button>
      </div>
    );
  }

  if (showTicketForm) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Submit Support Ticket</h2>
            <button
              onClick={() => setShowTicketForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitTicket} className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              required
              value={ticketForm.subject}
              onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={6}
              value={ticketForm.description}
              onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Please provide as much detail as possible about your issue..."
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <Paperclip className="w-5 h-5" />
                <span>Click to attach files or drag and drop</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, PDF, DOC, TXT (max 10MB each)
              </p>
            </div>

            {/* Attached Files */}
            {ticketForm.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {ticketForm.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowTicketForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Methods */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center mb-3">
                  <Icon className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="font-medium text-gray-900">{method.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {method.availability}
                  </div>
                  <div>Response time: {method.responseTime}</div>
                </div>
                <button
                  onClick={method.action}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  {method.name === 'Email Support' ? 'Create Ticket' : `Start ${method.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900 mb-1">Emergency Support</h3>
            <p className="text-sm text-red-700 mb-2">
              For critical issues affecting live events or system outages, contact our emergency line:
            </p>
            <a
              href="tel:+1-555-EMERGENCY"
              className="text-sm font-medium text-red-800 hover:text-red-900"
            >
              +1 (555) EMERGENCY
            </a>
          </div>
        </div>
      </div>

      {/* My Tickets */}
      {myTickets.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Support Tickets</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Ticket #{ticket.id}</span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="ml-4 text-blue-600 hover:text-blue-800 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Resources */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Self-Service Options</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Browse Knowledge Base
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Watch Tutorial Videos
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Check System Status
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  User Community Forum
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Feature Requests
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Product Updates
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};