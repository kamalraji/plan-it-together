import { useState } from 'react';
import { SegmentCriteria, UserRole, RegistrationStatus, RecipientPreview } from '../../types';

interface RecipientSegmentationProps {
  segmentCriteria: SegmentCriteria;
  onCriteriaChange: (criteria: SegmentCriteria) => void;
  recipientPreview: RecipientPreview | null;
  isLoading: boolean;
}

export function RecipientSegmentation({
  segmentCriteria,
  onCriteriaChange,
  recipientPreview,
  isLoading
}: RecipientSegmentationProps) {
  const [showRecipientList, setShowRecipientList] = useState(false);

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = segmentCriteria.roles || [];
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role);
    
    onCriteriaChange({
      ...segmentCriteria,
      roles: newRoles.length > 0 ? newRoles : undefined
    });
  };

  const handleRegistrationStatusChange = (status: RegistrationStatus, checked: boolean) => {
    const currentStatuses = segmentCriteria.registrationStatus || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onCriteriaChange({
      ...segmentCriteria,
      registrationStatus: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handleAttendanceStatusChange = (status: 'ATTENDED' | 'NOT_ATTENDED' | undefined) => {
    onCriteriaChange({
      ...segmentCriteria,
      attendanceStatus: status
    });
  };

  const clearAllFilters = () => {
    onCriteriaChange({});
  };

  // Note: Judges, Volunteers, and Speakers are now managed via workspace roles
  // and should be targeted through workspace-based segmentation in a future enhancement
  const roleOptions = [
    { value: UserRole.PARTICIPANT, label: 'Participants', description: 'Event attendees' },
    { value: UserRole.ORGANIZER, label: 'Organizers', description: 'Event organizers' },
  ];

  const registrationStatusOptions = [
    { value: RegistrationStatus.CONFIRMED, label: 'Confirmed', description: 'Confirmed registrations' },
    { value: RegistrationStatus.WAITLISTED, label: 'Waitlisted', description: 'On waiting list' },
    { value: RegistrationStatus.PENDING, label: 'Pending', description: 'Pending approval' },
    { value: RegistrationStatus.CANCELLED, label: 'Cancelled', description: 'Cancelled registrations' },
  ];

  const attendanceOptions = [
    { value: undefined, label: 'All', description: 'All participants regardless of attendance' },
    { value: 'ATTENDED' as const, label: 'Attended', description: 'Participants who checked in' },
    { value: 'NOT_ATTENDED' as const, label: 'Not Attended', description: 'Participants who did not check in' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Recipient Segmentation</h3>
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear All Filters
        </button>
      </div>

      <div className="space-y-6">
        {/* Role Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Filter by Role</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roleOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={segmentCriteria.roles?.includes(option.value) || false}
                  onChange={(e) => handleRoleChange(option.value, e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary focus-visible:ring-ring border-input rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Registration Status Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Filter by Registration Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {registrationStatusOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={segmentCriteria.registrationStatus?.includes(option.value) || false}
                  onChange={(e) => handleRegistrationStatusChange(option.value, e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary focus-visible:ring-ring border-input rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Attendance Status Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Filter by Attendance Status</h4>
          <div className="space-y-2">
            {attendanceOptions.map((option) => (
              <label key={option.value || 'all'} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="attendanceStatus"
                  checked={segmentCriteria.attendanceStatus === option.value}
                  onChange={() => handleAttendanceStatusChange(option.value)}
                  className="mt-1 h-4 w-4 text-primary focus-visible:ring-ring border-input"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Recipient Preview */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Recipient Preview</h4>
            {recipientPreview && recipientPreview.count > 0 && (
              <button
                type="button"
                onClick={() => setShowRecipientList(!showRecipientList)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showRecipientList ? 'Hide List' : 'Show List'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Loading recipients...</span>
            </div>
          ) : recipientPreview ? (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold text-primary">{recipientPreview.count}</span>
                  <span className="text-sm text-muted-foreground">
                    recipient{recipientPreview.count !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>

              {showRecipientList && recipientPreview.recipients.length > 0 && (
                <div className="bg-muted/50 border border-border rounded-md p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-1">
                    {recipientPreview.recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{recipient.name}</span>
                        <span className="text-muted-foreground">{recipient.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select filters above to preview recipients
            </div>
          )}
        </div>
      </div>
    </div>
  );
}