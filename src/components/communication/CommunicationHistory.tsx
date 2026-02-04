import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { CommunicationLog } from '../../types';

interface CommunicationHistoryProps {
  eventId: string;
}

export function CommunicationHistory({ eventId }: CommunicationHistoryProps) {
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);

  // Fetch communication logs (Requirements 8.4)
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['communication-logs', eventId],
    queryFn: async () => {
      const response = await api.get(`/communications/events/${eventId}/logs`);
      return response.data.data as CommunicationLog[];
    },
  });

  // Fetch detailed log when selected
  const { data: detailedLog, isLoading: detailLoading } = useQuery({
    queryKey: ['communication-log', selectedLog?.id],
    queryFn: async () => {
      if (!selectedLog?.id) return null;
      const response = await api.get(`/communications/logs/${selectedLog.id}`);
      return response.data.data as CommunicationLog;
    },
    enabled: !!selectedLog?.id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SENT: { color: 'bg-green-100 text-green-800', label: 'Sent' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      PARTIAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.FAILED;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Communication History</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span>Loading communication history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Communication History</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-red-400 text-3xl mb-2 font-bold">!</div>
          <p className="text-muted-foreground">Failed to load communication history</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Communication History</h2>
          <p className="text-muted-foreground">
            View all communications sent for this event.
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground text-4xl mb-2">📭</div>
          <p className="text-muted-foreground">No communications sent yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Communications you send will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Communication History</h2>
        <p className="text-muted-foreground">
          View all communications sent for this event, including delivery status and recipient counts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communication List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Recent Communications</h3>
          
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedLog?.id === log.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-border hover:border-input hover:shadow-sm'
                }`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground truncate pr-2">
                    {log.subject}
                  </h4>
                  {getStatusBadge(log.status)}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Sent by: {log.sender.name}</span>
                    <span>{log.recipientCount} recipients</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(log.sentAt)}
                  </div>
                </div>

                {selectedLog?.id === log.id && (
                  <div className="mt-2 pt-2 border-t border-indigo-200">
                    <span className="text-xs text-indigo-600 font-medium">
                      Click to view details →
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Communication Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Communication Details</h3>
          
          {selectedLog ? (
            <div className="bg-card border border-border rounded-lg p-6">
              {detailLoading ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Loading details...</span>
                </div>
              ) : detailedLog ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Subject</h4>
                    <p className="text-foreground">{detailedLog.subject}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Status</h4>
                      {getStatusBadge(detailedLog.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Recipients</h4>
                      <p className="text-foreground">{detailedLog.recipientCount}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">Sent By</h4>
                    <p className="text-foreground">
                      {detailedLog.sender.name} ({detailedLog.sender.email})
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">Sent At</h4>
                    <p className="text-foreground">{formatDate(detailedLog.sentAt)}</p>
                  </div>

                  {detailedLog.event && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Event</h4>
                      <p className="text-foreground">{detailedLog.event.name}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Communication ID: {detailedLog.id}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Failed to load communication details</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
              <div className="text-muted-foreground text-3xl mb-2">📄</div>
              <p className="text-muted-foreground">Select a communication to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}