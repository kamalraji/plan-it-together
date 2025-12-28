import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmailComposer } from './EmailComposer';
import { CommunicationHistory } from './CommunicationHistory';

interface CommunicationInterfaceProps {
  eventId?: string;
}

export function CommunicationInterface({ eventId: propEventId }: CommunicationInterfaceProps) {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = propEventId || paramEventId;
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event ID Required</h2>
          <p className="text-gray-600">Please select an event to access communication features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Communication</h1>
          <p className="text-gray-600 mt-2">
            Send targeted communications to event participants and manage your communication history.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'compose', label: 'Compose Email', icon: '✉️' },
                { key: 'history', label: 'Communication History', icon: '📋' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'compose' && <EmailComposer eventId={eventId} />}
            {activeTab === 'history' && <CommunicationHistory eventId={eventId} />}
          </div>
        </div>
      </div>
    </div>
  );
}